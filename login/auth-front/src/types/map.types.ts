export interface TruckPoint {
  lat: number;
  lng: number;
  status?: 'active' | 'loading' | 'idle';
  truckId?: string;
  imei?: string;
  speed?: number;
  timestamp?: string;
  altitude?: number;
  angle?: number;
  satellites?: number;
  hdop?: number;
  additionalData?: any;
  operator?: {
    name: string;
    age: number;
    license: string;
    experience: string;
    shift: string;
    contact: string;
  };
  truckInfo?: {
    model: string;
    capacity: string;
    year: number;
    maintenance: string;
  };
}

export interface GoogleMapStaticProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}