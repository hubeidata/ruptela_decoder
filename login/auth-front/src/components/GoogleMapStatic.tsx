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
              {/* SVG de auto visto desde arriba, apuntando al norte */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                {/* Cuerpo del auto */}
                <rect x="10" y="4" width="12" height="24" rx="4" fill="#1976d2" />
                {/* Parabrisas */}
                <rect x="12" y="6" width="8" height="6" rx="2" fill="#90caf9" />
                {/* Ventana trasera */}
                <rect x="12" y="20" width="8" height="6" rx="2" fill="#90caf9" />
                {/* Ruedas */}
                <rect x="8" y="6" width="2" height="6" rx="1" fill="#333" />
                <rect x="22" y="6" width="2" height="6" rx="1" fill="#333" />
                <rect x="8" y="20" width="2" height="6" rx="1" fill="#333" />
                <rect x="22" y="20" width="2" height="6" rx="1" fill="#333" />
              </svg>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}