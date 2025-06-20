import React from 'react';
import GoogleMapStatic from './GoogleMapStatic';
import { MapHeader } from './MapHeader';

interface MapSectionProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

export const MapSection: React.FC<MapSectionProps> = ({ initialCenter, initialZoom }) => {
  return (
    <>
      <h2 className="mt-4 mb-3">🗺️ Mapa de Eventos GPS</h2>
      <div 
        className="shadow-reports"
        style={{ 
          position: "relative", 
          width: "100%", 
          height: "500px",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >
        {/* MapHeader como overlay */}
        <MapHeader />
        
        <GoogleMapStatic 
          initialCenter={initialCenter} 
          initialZoom={initialZoom} 
        />
      </div>
    </>
  );
};