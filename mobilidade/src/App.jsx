import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion';
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css';

import './App.css'
import InteractionBlocker from './InteractionBlocker';
import { MapInteractionContext } from './MapInteractionContext';
import { preloadChapter } from './preloadUtils';
import AlarmScreen from './AlarmScreen';
import Content from './Content';
import PrologueSection from './PrologueSection';


preloadChapter('intro');



const chapters = {
  'intro': {
    center: [-34.8717381, -8.0632174],
    zoom: 15.12,
    pitch: 0,
    bearing: 0
  },
  'intro-1': {
    center: [-34.8717381, -8.0632174],
    zoom: 15.5,
    pitch: 10,
    bearing: 0
  },
  'intro-2': {
    center: [-34.8717381, -8.0632174],
    zoom: 16,
    pitch: 20,
    bearing: 10
  },
  'intro-3': {
    center: [-34.8717381, -8.0632174],
    zoom: 16.5,
    pitch: 30,
    bearing: -10
  },
  'metro-1': {
    center: [-34.8847, -8.0683], // Estação Recife
    zoom: 14,
    pitch: 45,
    bearing: 15
  },
  'metro-2': {
    center: [-34.8847, -8.0683],
    zoom: 13, // Zoom out slightly
    pitch: 30,
    bearing: 0
  },
  'metro-3': {
    center: [-34.8847, -8.0683],
    zoom: 12, // Zoom out more for context
    pitch: 0,
    bearing: 0
  }
};



function App() {

  const mapRef = useRef()
  const mapContainerRef = useRef()

  // Control Alarm visibility
  const [showAlarm, setShowAlarm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const alarmParam = params.get('alarm');
    if (alarmParam !== null) return alarmParam === 'true';
    // Default: False in Dev, True in Prod
    return !import.meta.env.DEV;
  });
  const alarmVisibleRef = useRef(showAlarm);

  useEffect(() => {
    alarmVisibleRef.current = showAlarm;
    if (showAlarm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showAlarm]);

  const isTouringRef = useRef(true);

  // Function to handle alarm dismissal
  const handleAlarmDismiss = () => {
    setShowAlarm(false);
  };



  // Register Service Worker for Tile Caching
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // State to track map position (optional, kept from user's attempt)
  const [center, setCenter] = useState([-34.8717381, -8.0632174])
  const [zoom, setZoom] = useState(15.12)



  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGpjbzIxIiwiYSI6ImNtaXA3cDBlejBhaW0zZG9sbXZpOHFhYnQifQ.Bo43glKkuVwj310Z-L58oQ'

    // Reverse Tour: Start at the END (metro-3)
    const initialView = showAlarm ? chapters['metro-3'] : chapters['intro'];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialView.center,
      zoom: initialView.zoom,
      pitch: initialView.pitch,
      bearing: initialView.bearing,
    });

    // Disable scroll zoom to prevent interference with page scrolling
    mapRef.current.scrollZoom.disable();

    // Update state on move (optional feature user seemed to want)
    mapRef.current.on('move', () => {
      const mapCenter = mapRef.current.getCenter();
      const mapZoom = mapRef.current.getZoom();
      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    // Reverse Tour Logic
    mapRef.current.on('load', () => {
      // Insert the layer beneath the first symbol layer.
      const layers = mapRef.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      ).id;

      // The 'building' layer in the Mapbox Streets vector tileset contains building height data
      // from OpenStreetMap.
      mapRef.current.addLayer(
        {
          'id': 'add-3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-opacity': 1,
            'fill-extrusion-color': '#CECECE',

            // Use an 'interpolate' expression to
            // add a smooth transition effect to
            // the buildings as the user zooms in.
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 1
          }
        },
        labelLayerId
      );

      // Initialize Flashlight Effect
      // 1. Configure Layers to be hidden by default but distinct (using feature-state)
      const layersToEffect = ['poi-label', 'transit-label', 'road-label', 'road-number-shield', 'road-exit-shield'];

      layersToEffect.forEach(layerId => {
        if (mapRef.current.getLayer(layerId)) {
          // Set initial opacity to 0 (hidden)
          // We use a case expression: if feature-state.hover is true, opacity 1, else 0
          mapRef.current.setPaintProperty(layerId, 'text-opacity', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0
          ]);
          mapRef.current.setPaintProperty(layerId, 'icon-opacity', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0
          ]);

          // Add transition for smooth in/out
          mapRef.current.setPaintProperty(layerId, 'text-opacity-transition', { duration: 300, delay: 0 });
          mapRef.current.setPaintProperty(layerId, 'icon-opacity-transition', { duration: 300, delay: 0 });
        }
      });

      if (showAlarm) {
        const chapterKeys = Object.keys(chapters); // ['intro', ..., 'metro-3']
        // We want to go from metro-3 (end) BACK to intro (start)
        // We are already at metro-3. Next target is metro-2.

        let currentIndex = chapterKeys.length - 1;

        const playNextStep = () => {
          // Check if tour is still active
          if (!isTouringRef.current) return;

          currentIndex--;
          if (currentIndex < 0) {
            // Stop logic: we reached the start
            return;
          }

          const targetChapter = chapters[chapterKeys[currentIndex]];

          mapRef.current.flyTo({
            ...targetChapter,
            duration: 2000, // Fast jump
            essential: true
          });

          mapRef.current.once('moveend', () => {
            // Only continue if touring is active
            if (isTouringRef.current) {
              playNextStep();
            }
          });
        };

        // Start the chain
        playNextStep();
      }
    });

    return () => {
      mapRef.current.remove()
    }
  }, [])

  // Interaction Blocking Logic & Flashlight Tracking
  const [isInteractionBlocked, setInteractionBlocked] = useState(false);
  const isInteractionBlockedRef = useRef(false);
  const hoveredFeatures = useRef(new Set());

  // Sync state to ref for event handlers
  useEffect(() => {
    isInteractionBlockedRef.current = isInteractionBlocked;
  }, [isInteractionBlocked]);

  // Handle Drag Pan
  useEffect(() => {
    if (!mapRef.current) return;
    if (isInteractionBlocked) {
      mapRef.current.dragPan.disable();
    } else {
      mapRef.current.dragPan.enable();
    }
  }, [isInteractionBlocked]);

  // Handle Flashlight Mouse Move
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Re-implemented logic for correct Set usage
    const handleFlashlight = (e) => {
      if (isInteractionBlockedRef.current) {
        // Clear all
        hoveredFeatures.current.forEach(f => {
          map.setFeatureState({ source: f.source, sourceLayer: f.sourceLayer, id: f.id }, { hover: false });
        });
        hoveredFeatures.current.clear();
        return;
      }

      const radius = 100; // Radius in pixels
      const bbox = [
        [e.point.x - radius, e.point.y - radius],
        [e.point.x + radius, e.point.y + radius]
      ];

      const layersToQuery = ['poi-label', 'transit-label', 'road-label', 'road-number-shield', 'road-exit-shield'].filter(layer => map.getLayer(layer));
      if (layersToQuery.length === 0) return;

      const features = map.queryRenderedFeatures(bbox, { layers: layersToQuery });

      const currentFeaturesMap = new Map();

      features.forEach(f => {
        if (f.id !== undefined) {
          const key = `${f.source}|${f.sourceLayer}|${f.id}`;
          currentFeaturesMap.set(key, { source: f.source, sourceLayer: f.sourceLayer, id: f.id });

          // Ensure it is 'hovered'
          // Optimization: only set if it wasn't already? Mapbox handles redundant calls well? 
          // Creating a setFeatureState call every move for every feature in radius is okay-ish (10-20 features).
          map.setFeatureState({ source: f.source, sourceLayer: f.sourceLayer, id: f.id }, { hover: true });
        }
      });

      // Remove old ones
      hoveredFeatures.current.forEach((obj, key) => {
        if (!currentFeaturesMap.has(key)) {
          map.setFeatureState({ source: obj.source, sourceLayer: obj.sourceLayer, id: obj.id }, { hover: false });
        }
      });

      hoveredFeatures.current = currentFeaturesMap;
    };

    map.on('mousemove', handleFlashlight);

    // Cleanup on unmount or map change
    // Using a stable function reference is key or map.off won't work if defined inside.
    // Putting it inside useEffect is fine.

    return () => {
      if (map) map.off('mousemove', handleFlashlight);
    };
  }, []); // Empty dependency array, depends on Ref for blocked state

  // Removed legacy handlers handleMouseEnter/Leave

  // Handlers removed in favor of Context

  useEffect(() => {
    if (showAlarm) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isTouringRef.current = false; // Stop the auto-tour
          const chapterName = entry.target.getAttribute('id');
          const chapter = chapters[chapterName];
          if (chapter && mapRef.current) {
            mapRef.current.flyTo({
              ...chapter,
              essential: true,
            });

            // Preload next chapter
            const chapterKeys = Object.keys(chapters);
            const currentIndex = chapterKeys.indexOf(chapterName);
            const nextChapterName = chapterKeys[currentIndex + 1];
            if (nextChapterName) {
              const nextChapter = chapters[nextChapterName];
              preloadChapter(mapRef.current, nextChapter);
            }
          }
        }
      });
    }, { threshold: 0.5 });

    // OBSERVE MAP TRIGGERS
    document.querySelectorAll('.map-trigger').forEach(trigger => {
      observer.observe(trigger);
    });

    return () => {
      observer.disconnect();
    }
  }, [showAlarm]); // Re-run when alarm state changes

  // Handlers removed in favor of Context

  return (
    <>
      {showAlarm && <AlarmScreen onDismiss={handleAlarmDismiss} />}



      <MapInteractionContext.Provider value={{ isInteractionBlocked, setInteractionBlocked }}>
        {/* Map Container - Z-Index 0 implicitly (or -1) */}
        <div className='map-container' ref={mapContainerRef} style={{ position: 'fixed', top: 0, bottom: 0, width: '100%', zIndex: -1 }} />

        {/* Wrapper handles layout and conditional padding */}
        <div className={!showAlarm ? "content-container" : ""} style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PrologueSection transparent={!showAlarm} />
            {!showAlarm && <Content />}
          </div>
        </div>
      </MapInteractionContext.Provider >
    </>
  )
}

export default App
