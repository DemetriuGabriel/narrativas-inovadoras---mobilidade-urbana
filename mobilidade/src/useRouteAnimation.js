import { useEffect, useRef, useState } from 'react';

// Using a Worker requires a bundler that supports `new Worker(new URL(...))` syntax (Vite/Webpack 5)
// This logic offloads geometry processing to keep the UI thread smooth.

export const useRouteAnimation = (mapInstance, sourceId2D, sourceId3D, originalGeoJSON, config) => {
    // Config: speed/duration is ignored as we are now instant.
    const { visible } = config;

    // Worker Management
    const [worker, setWorker] = useState(null);

    // Keep mapInstance in ref for async worker callbacks
    const mapInstanceRef = useRef(mapInstance);
    useEffect(() => {
        mapInstanceRef.current = mapInstance;
    }, [mapInstance]);

    // 1. Initialize Worker
    useEffect(() => {
        // Create worker
        const newWorker = new Worker(new URL('./routeAnimation.worker.js', import.meta.url), { type: 'module' });

        newWorker.onmessage = (e) => {
            const { type, payload } = e.data;

            if (type === 'UPDATE_DONE') {
                const map = mapInstanceRef.current;
                if (!map) return;

                const { data2D, data3D } = payload;

                // Direct Map Updates
                const source2D = map.getSource(sourceId2D);
                if (source2D) source2D.setData(data2D);

                const source3D = map.getSource(sourceId3D);
                if (source3D) source3D.setData(data3D);
            }
        };

        setWorker(newWorker);

        return () => {
            newWorker.terminate();
        };
    }, []);

    // 2. Initialize Data in Worker & Trigger Initial State
    useEffect(() => {
        if (worker && originalGeoJSON) {
            worker.postMessage({
                type: 'INIT',
                payload: { geojson: originalGeoJSON }
            });

            // Trigger initial visibility state after init
            const target = visible ? 1 : 0;
            worker.postMessage({
                type: 'UPDATE',
                payload: { progress: target }
            });
        }
    }, [worker, originalGeoJSON]);

    // 3. Toggle Visibility (Instant Update)
    // Run when visible changes OR when mapInstance becomes available
    useEffect(() => {
        if (!worker) return;

        const target = visible ? 1 : 0;

        worker.postMessage({
            type: 'UPDATE',
            payload: { progress: target }
        });

    }, [worker, visible, mapInstance]);

    // No ref needed for progress anymore as it's binary state
    return visible ? 1 : 0;
};
