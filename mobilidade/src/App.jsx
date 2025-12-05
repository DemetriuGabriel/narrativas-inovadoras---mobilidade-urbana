import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css';

import './App.css'

const chapters = {
  'intro': {
    center: [-34.8717381, -8.0632174],
    zoom: 15.12,
    pitch: 0,
    bearing: 0
  },
  'mobilidade': {
    center: [-34.8735, -8.055],
    zoom: 14.5,
    pitch: 45,
    bearing: 15
  },
  'dados': {
    center: [-34.88, -8.06],
    zoom: 13,
    pitch: 60,
    bearing: -20
  },
  'conclusao': {
    center: [-34.8717381, -8.0632174],
    zoom: 16,
    pitch: 20,
    bearing: 0
  }
};

function App() {

  const mapRef = useRef()
  const mapContainerRef = useRef()

  // State to track map position (optional, kept from user's attempt)
  const [center, setCenter] = useState([-34.8717381, -8.0632174])
  const [zoom, setZoom] = useState(15.12)

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGpjbzIxIiwiYSI6ImNtaXA3cDBlejBhaW0zZG9sbXZpOHFhYnQifQ.Bo43glKkuVwj310Z-L58oQ'
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: chapters['intro'].center,
      zoom: chapters['intro'].zoom,
      pitch: chapters['intro'].pitch,
      bearing: chapters['intro'].bearing,
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

    return () => {
      mapRef.current.remove()
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const chapterName = entry.target.getAttribute('id');
          const chapter = chapters[chapterName];
          if (chapter && mapRef.current) {
            mapRef.current.flyTo({
              ...chapter,
              essential: true
            });
          }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Handlers to disable/enable map pan when hovering over cards
  const handleMouseEnter = () => {
    if (mapRef.current) mapRef.current.dragPan.disable();
  };

  const handleMouseLeave = () => {
    if (mapRef.current) mapRef.current.dragPan.enable();
  };

  return (
    <>
      <div className='map-container' ref={mapContainerRef} />

      <div className="content-container">
        <div
          className="section"
          id="intro"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <h1>Narrativas Inovadoras</h1>
        </div>
        <div
          className="section"
          id="mobilidade"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p>Mobilidade Urbana em Recife</p>
        </div>
        <div
          className="section"
          id="dados"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p>Explore os dados</p>
        </div>
        <div
          className="section"
          id="conclusao"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p>Conclusão</p>
        </div>
      </div>
    </>
  )
}

export default App
