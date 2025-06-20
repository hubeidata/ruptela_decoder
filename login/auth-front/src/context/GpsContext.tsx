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
  gpsMap: Record<string, GpsData>;
  updateGpsData: (imei: string, data: GpsData) => void;
}

const GpsContext = createContext<GpsContextType | undefined>(undefined);

export const GpsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gpsMap, setGpsMap] = useState<Record<string, GpsData>>({});

  const updateGpsData = (imei: string, data: GpsData) => {
    setGpsMap(prev => ({
      ...prev,
      [imei]: data
    }));
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

// En tu archivo GpsWebSocketInit.tsx
import { useGpsContext } from './GpsContext';

const { updateGpsData } = useGpsContext();

// ...

if (data.imei) {
  updateGpsData(data.imei, data);
}