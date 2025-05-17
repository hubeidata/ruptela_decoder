import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const points = [
  { lat: -34.6037, lng: -58.3816, label: "Buenos Aires" },
  { lat: -33.4489, lng: -70.6693, label: "Santiago" },
  { lat: -12.0464, lng: -77.0428, label: "Lima" },
];

const center = points[0];

export default function GoogleMapStatic() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_API_MAPS as string,
  });

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={4}>
      {points.map((point, idx) => (
        <Marker key={idx} position={{ lat: point.lat, lng: point.lng }} label={point.label} />
      ))}
    </GoogleMap>
  );
}