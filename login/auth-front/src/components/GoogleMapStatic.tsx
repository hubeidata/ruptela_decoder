import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

interface GoogleMapStaticProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

const containerStyle = {
  position: "relative",
  width: "100%",
  height: "calc(100vh - 60px)",
  marginTop: "60px",
  pointerEvents: "auto",
};

const points = [
  { lat: -16.410471, lng: -71.53088 },
  { lat: -16.409, lng: -71.528 },
  { lat: -16.412, lng: -71.532 },
  { lat: -16.4135, lng: -71.5295 },
];

export default function GoogleMapStatic({ initialCenter, initialZoom }: GoogleMapStaticProps) {
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Handler for when the map instance is ready
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    console.log('Map loaded');
  };

  // Handler for map movements
  const handleMapChange = () => {
    if (!mapRef.current) return;

    const newCenter = mapRef.current.getCenter();
    const newZoom = mapRef.current.getZoom();

    if (newCenter && newZoom) {
      console.log('Map is moving...', {
        currentCenter: { lat: newCenter.lat(), lng: newCenter.lng() },
        currentZoom: newZoom
      });
      
      setMapCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
      setMapZoom(newZoom);
    }
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={containerStyle}>
        <Map
          center={mapCenter}
          zoom={mapZoom}
          mapId={import.meta.env.VITE_MAP_ID as string}
          style={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: true,
            scrollwheel: true,
            draggable: true,
            fullscreenControl: true,
            mapTypeControl: true,
            gestureHandling: "greedy",
          }}
          onLoad={onMapLoad}
          onDragEnd={handleMapChange}
          onZoomChanged={handleMapChange}
          onClick={(e) => console.log('Map clicked', e)}
        >
          {points.map((point, idx) => (
            <AdvancedMarker key={idx} position={point}>
              <Pin />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}