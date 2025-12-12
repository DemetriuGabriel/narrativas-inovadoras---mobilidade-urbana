import * as turf from '@turf/turf';

let processedGeoJSON = null;
let totalLength = 0;

self.onmessage = (e) => {
    const { type, payload } = e.data;

    if (type === 'INIT') {
        const { geojson } = payload;
        if (!geojson) return;

        // Simplify first to reduce point count (Optimize Performance)
        // Tolerance: 0.00005 is approx 5 meters precision
        const simplified = turf.simplify(geojson, { tolerance: 0.00005, highQuality: false });

        // FLATTEN & SORT LOGIC
        const flattened = turf.flatten(simplified);
        let features = flattened.features;

        if (features.length > 1) {
            const sorted = [];
            const pool = [...features];
            let current = pool.shift();
            sorted.push(current);

            while (pool.length > 0) {
                const tail = current.geometry.coordinates[current.geometry.coordinates.length - 1];
                let closestIndex = -1;
                let minDistance = Infinity;
                let shouldReverse = false;

                for (let i = 0; i < pool.length; i++) {
                    const f = pool[i];
                    const fStart = f.geometry.coordinates[0];
                    const fEnd = f.geometry.coordinates[f.geometry.coordinates.length - 1];

                    const distStart = turf.distance(tail, fStart);
                    const distEnd = turf.distance(tail, fEnd);

                    if (distStart < minDistance) {
                        minDistance = distStart;
                        closestIndex = i;
                        shouldReverse = false;
                    }
                    if (distEnd < minDistance) {
                        minDistance = distEnd;
                        closestIndex = i;
                        shouldReverse = true;
                    }
                }

                if (closestIndex !== -1 && minDistance < 1.0) {
                    const nextFeature = pool.splice(closestIndex, 1)[0];
                    if (shouldReverse) nextFeature.geometry.coordinates.reverse();
                    sorted.push(nextFeature);
                    current = nextFeature;
                } else {
                    const nextFeature = pool.shift();
                    sorted.push(nextFeature);
                    current = nextFeature;
                }
            }
            features = sorted;
        }

        processedGeoJSON = turf.featureCollection(features);
        totalLength = turf.length(processedGeoJSON);

        self.postMessage({ type: 'INIT_DONE', payload: { totalLength } });
    }

    if (type === 'UPDATE') {
        if (!processedGeoJSON) return;

        const { progress } = payload;
        const targetDist = progress * totalLength;
        const outputFeatures = [];
        let coveredDist = 0;

        try {
            for (const feature of processedGeoJSON.features) {
                const segmentLen = turf.length(feature);

                if (coveredDist + segmentLen <= targetDist) {
                    outputFeatures.push(feature);
                    coveredDist += segmentLen;
                } else if (coveredDist < targetDist) {
                    const remaining = targetDist - coveredDist;
                    if (remaining > 0) {
                        const sliced = turf.lineSliceAlong(feature, 0, remaining);
                        outputFeatures.push(sliced);
                    }
                    coveredDist += remaining;
                    break;
                } else {
                    break;
                }
            }

            const currentData = turf.featureCollection(outputFeatures);

            // Heavy operation: Buffering for 3D
            let bufferedData = null;
            if (outputFeatures.length > 0 && progress > 0.001) {
                // Optimization: steps: 1 creates square/lo-poly buffers
                bufferedData = turf.buffer(currentData, 0.015, { units: 'kilometers', steps: 1 });
            } else {
                bufferedData = turf.featureCollection([]);
            }

            self.postMessage({
                type: 'UPDATE_DONE',
                payload: {
                    data2D: currentData,
                    data3D: bufferedData
                }
            });

        } catch (err) {
            console.error("Worker Error:", err);
        }
    }
};
