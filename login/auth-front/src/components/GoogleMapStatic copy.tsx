import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Centro del mapa (puede ser uno de los puntos o cualquier ubicación)
const center = { lat: 40.7128, lng: -74.0060 }; // Ejemplo: Nueva York

// Tres puntos para marcar en el mapa
const points = [
  { lat: 40.7128, lng: -74.0060 }, // Punto 1: Centro (NYC)
  { lat: 40.730610, lng: -73.935242 }, // Punto 2
  { lat: 40.758896, lng: -73.985130 }, // Punto 3
];

export default function MapExample() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_API_MAPS, // Tu API key aquí
  });

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
      {points.map((point, index) => (
        <Marker key={index} position={point} />
      ))}
    </GoogleMap>
  );
}