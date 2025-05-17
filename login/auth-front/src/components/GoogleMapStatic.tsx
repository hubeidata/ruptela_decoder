import React, { useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
// Import the AdvancedMarkerElement
import { AdvancedMarkerElement } from "@googlemaps/advanced-markers";

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
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_API_MAPS as string,
    libraries: ["marker"], // Required for advanced markers
  });

  // Add advanced markers when the map loads
  const handleOnLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    // Remove existing markers if any
    (window as any).advancedMarkers?.forEach((marker: any) => (marker.map = null));
    (window as any).advancedMarkers = [];

    points.forEach((point) => {
      const marker = new AdvancedMarkerElement({
        map,
        position: point,
      });
      (window as any).advancedMarkers.push(marker);
    });
  };

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={handleOnLoad}
    />
  );
}