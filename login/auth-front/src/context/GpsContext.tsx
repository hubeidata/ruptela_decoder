import React, { createContext, useContext, useRef } from "react";

export interface GpsTransmission {
  imei: string;
  lat: number;
  lng: number;
  timestamp: string;
  [key: string]: any;
}

type GpsMap = Map<string, GpsTransmission>;

const GpsContext = createContext<{ gpsMap: GpsMap }>({ gpsMap: new Map() });

export function useGpsContext() {
  return useContext(GpsContext);
}

export const GpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Usar useRef para mantener la referencia entre renders
  const gpsMapRef = useRef<GpsMap>(new Map());

  return (
    <GpsContext.Provider value={{ gpsMap: gpsMapRef.current }}>
      {children}
    </GpsContext.Provider>
  );
};