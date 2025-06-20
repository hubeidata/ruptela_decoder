import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GpsData {
  imei: string;
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  altitude?: number;
  angle?: number;
  satellites?: number;
  hdop?: number;
  deviceno?: string;
  carlicense?: string;
  additionalData?: any;
}

interface GpsContextType {
  gpsMap: Map<string, GpsData>;
  updateGpsData: (imei: string, data: GpsData) => void;
}

const GpsContext = createContext<GpsContextType | undefined>(undefined);

export const GpsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gpsMap] = useState<Map<string, GpsData>>(new Map());

  const updateGpsData = (imei: string, data: GpsData) => {
    console.log(`[GPS_CONTEXT] Actualizando datos para IMEI: ${imei}`, data);
    gpsMap.set(imei, data);
    console.log(`[GPS_CONTEXT] Total dispositivos en el mapa: ${gpsMap.size}`);
  };

  return (
    <GpsContext.Provider value={{ gpsMap, updateGpsData }}>
      {children}
    </GpsContext.Provider>
  );
};

export const useGpsContext = () => {
  const context = useContext(GpsContext);
  if (context === undefined) {
    throw new Error('useGpsContext must be used within a GpsProvider');
  }
  return context;
};