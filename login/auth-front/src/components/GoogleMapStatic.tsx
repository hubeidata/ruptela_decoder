import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Puntos para mostrar como marcadores
const points = [
  { lat: -16.410471, lng: -71.530880, label: "Centro" },   // Centro fijo
  { lat: -16.409000, lng: -71.528000, label: "Punto 1" },
  { lat: -16.412000, lng: -71.532000, label: "Punto 2" },
  { lat: -16.413500, lng: -71.529500, label: "Punto 3" },
];

// Centro fijo del mapa
const center = { lat: -16.410471, lng: -71.530880 };

export default function GoogleMapStatic() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_API_MAPS as string,
  });

  console.log("isLoaded:", isLoaded);
  console.log("points:", points);

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
    >
      {points.map((point, idx) => {
        console.log("Rendering marker:", point);
        return (
          <Marker
            key={idx}
            position={{ lat: point.lat, lng: point.lng }}
            label={point.label}
            title={`Marcador ${point.label}`}
            icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
          />
        );
      })}
    </GoogleMap>
  );
}