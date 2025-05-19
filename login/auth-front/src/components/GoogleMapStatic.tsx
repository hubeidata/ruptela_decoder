import React from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const containerStyle = {
  position: "relative", // Cambiado a relativo para respetar el flujo del diseño
  width: "100%",
  height: "calc(100vh - 60px)", // Ajusta la altura para dejar espacio al menú superior
  marginTop: "60px", // Asegura que el mapa no se superponga al menú
  pointerEvents: "auto", // Permite que los eventos del mouse lleguen al mapa
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
          mapId={import.meta.env.VITE_MAP_ID as string}
          tilt={45}
          heading={90}
          style={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: true, // Habilita los botones de zoom
            scrollwheel: true, // Permite hacer zoom con la rueda del ratón
            draggable: true, // Permite arrastrar el mapa
            fullscreenControl: true, // Habilita el control de pantalla completa
            mapTypeControl: true, // Habilita el control de tipo de mapa
            gestureHandling: "auto", // Permite gestos como scroll y arrastre
          }}
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