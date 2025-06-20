import { TruckPoint } from '../types/map.types';

// Función para determinar el estado basado en la velocidad
export const getStatusFromSpeed = (speed: number): 'active' | 'loading' | 'idle' => {
  if (speed > 5) return 'active';
  if (speed > 0) return 'loading';
  return 'idle';
};

// Función para calcular el ángulo entre dos puntos
export const calculateBearing = (
  start: { lat: number; lng: number }, 
  end: { lat: number; lng: number }
): number => {
  const deltaLng = end.lng - start.lng;
  const deltaLat = end.lat - start.lat;
  
  let angle = Math.atan2(deltaLng, deltaLat);
  let degrees = angle * (180 / Math.PI);
  degrees = (90 - degrees + 360) % 360;
  
  return degrees;
};

// Función para obtener texto del estado
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'En movimiento';
    case 'loading': return 'Cargando';
    case 'idle': return 'Inactivo';
    default: return 'Desconocido';
  }
};

// Función para formatear timestamp
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Función para calcular rotación de un punto
export const getRotationForPoint = (point: TruckPoint, points: TruckPoint[]): number => {
  if (point.angle !== undefined && point.angle !== null) {
    return point.angle;
  }
  
  const index = points.findIndex(p => p.imei === point.imei);
  if (index === -1) return 0;
  
  if (index === points.length - 1) {
    if (index > 0) {
      return calculateBearing(points[index - 1], points[index]);
    }
    return 0;
  }
  return calculateBearing(points[index], points[index + 1]);
};