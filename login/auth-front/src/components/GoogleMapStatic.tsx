import React from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = { lat: -16.410471, lng: -71.53088 };

const points = [
  { lat: -16.410471, lng: -71.53088 },
  { lat: -16.409, lng: -71.528 },
  { lat: -16.412, lng: -71.532 },
  { lat: -16.4135, lng: -71.5295 },
];

export default function GoogleMapStatic() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={containerStyle}>
        <Map
          center={center}
          zoom={15}
          mapId={import.meta.env.VITE_MAP_ID as string} // <-- Carga el Map ID desde .env
          tilt={45}
          heading={90}
          style={{ width: "100%", height: "100%" }}
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