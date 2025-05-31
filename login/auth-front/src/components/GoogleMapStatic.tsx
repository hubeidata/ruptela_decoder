import React, { useRef } from "react";
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
  const mapRef = useRef<google.maps.Map | null>(null);

  // Handler for when the map instance is ready
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    console.log('Map loaded');
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={containerStyle}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom} // <-- Cambia 'zoom' por 'defaultZoom'
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
          onClick={(e) => console.log('Map clicked', e)}
        >
          {points.map((point, idx) => (
            <AdvancedMarker key={idx} position={point}>
              {/* SVG de carro */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="14" width="24" height="8" rx="2" fill="#1976d2"/>
                <rect x="8" y="10" width="16" height="6" rx="2" fill="#90caf9"/>
                <circle cx="9" cy="24" r="3" fill="#333"/>
                <circle cx="23" cy="24" r="3" fill="#333"/>
              </svg>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}