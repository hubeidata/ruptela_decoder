import React, { useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface GoogleMapStaticProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

interface TruckPoint {
  lat: number;
  lng: number;
  status?: 'active' | 'loading' | 'unloading' | 'idle';
  truckId?: string;
  load?: number; // 0-100 porcentaje de carga
}

const containerStyle = {
  position: "relative",
  width: "100%",
  height: "calc(100vh - 60px)",
  marginTop: "60px",
  pointerEvents: "auto",
};

const points: TruckPoint[] = [
  { lat: -16.410471, lng: -71.53088, status: 'loading', truckId: 'T001', load: 85 },
  { lat: -16.409, lng: -71.528, status: 'active', truckId: 'T002', load: 60 },
  { lat: -16.412, lng: -71.532, status: 'unloading', truckId: 'T003', load: 30 },
  { lat: -16.4135, lng: -71.5295, status: 'idle', truckId: 'T004', load: 0 },
];

// Función para calcular el ángulo entre dos puntos
const calculateBearing = (start: {lat: number, lng: number}, end: {lat: number, lng: number}): number => {
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const deltaLng = (end.lng - start.lng) * Math.PI / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
};

// Componente del volquete con estados
const TruckIcon = ({ 
  rotation = 0, 
  status = 'idle',
  load = 0,
  truckId = '',
  onClick 
}: { 
  rotation?: number;
  status?: 'active' | 'loading' | 'unloading' | 'idle';
  load?: number;
  truckId?: string;
  onClick?: () => void;
}) => {
  // Colores según el estado
  const getStatusColors = () => {
    switch (status) {
      case 'active':
        return { box: '#4caf50', cabin: '#2e7d32', pulse: '#81c784' };
      case 'loading':
        return { box: '#ff9800', cabin: '#f57c00', pulse: '#ffb74d' };
      case 'unloading':
        return { box: '#f44336', cabin: '#d32f2f', pulse: '#e57373' };
      default:
        return { box: '#757575', cabin: '#424242', pulse: '#9e9e9e' };
    }
  };

  const colors = getStatusColors();
  
  return (
    <div 
      style={{ 
        transform: `rotate(${rotation}deg)`, 
        transformOrigin: 'center',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onClick}
    >
      {/* Pulso animado para estados activos */}
      {(status === 'loading' || status === 'unloading') && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            left: '-10px',
            width: '60px',
            height: '60px',
            backgroundColor: colors.pulse,
            borderRadius: '50%',
            opacity: 0.3,
            animation: 'pulse 2s infinite',
            zIndex: -1
          }}
        />
      )}
      
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        {/* ===== CAJA DEL VOLQUETE con indicador de carga ===== */}
        <rect
          x="4"
          y="10"
          width="18"
          height="12"
          rx="2"
          fill={colors.box}
          stroke="#424242"
          strokeWidth="1"
        />
        
        {/* Indicador de nivel de carga */}
        <rect
          x="5"
          y={22 - (load * 10 / 100)}
          width="16"
          height={load * 10 / 100}
          fill="#8d6e63"
          opacity="0.8"
        />
        
        {/* ===== CABINA DEL CONDUCTOR ===== */}
        <rect
          x="22"
          y="14"
          width="10"
          height="8"
          rx="2"
          fill={colors.cabin}
          stroke="#212121"
          strokeWidth="1"
        />
        
        {/* ===== PARABRISAS ===== */}
        <rect
          x="24"
          y="16"
          width="6"
          height="4"
          rx="1"
          fill="#81d4fa"
          stroke="#0277bd"
          strokeWidth="0.5"
        />
        
        {/* ===== CAPÓ/FRENTE ===== */}
        <rect
          x="32"
          y="16"
          width="4"
          height="4"
          rx="1"
          fill="#1565c0"
          stroke="#0d47a1"
          strokeWidth="1"
        />
        
        {/* ===== RUEDAS ===== */}
        <circle cx="8" cy="24" r="3" fill="#424242" stroke="#212121" strokeWidth="1" />
        <circle cx="14" cy="24" r="3" fill="#424242" stroke="#212121" strokeWidth="1" />
        <circle cx="18" cy="24" r="3" fill="#424242" stroke="#212121" strokeWidth="1" />
        <circle cx="28" cy="24" r="3" fill="#424242" stroke="#212121" strokeWidth="1" />
        
        {/* ===== LLANTAS ===== */}
        <circle cx="8" cy="24" r="1.5" fill="#666666" />
        <circle cx="14" cy="24" r="1.5" fill="#666666" />
        <circle cx="18" cy="24" r="1.5" fill="#666666" />
        <circle cx="28" cy="24" r="1.5" fill="#666666" />
        
        {/* ===== INDICADOR DE DIRECCIÓN ===== */}
        <polygon
          points="33,12 37,15 33,18"
          fill="#ff5722"
          stroke="#d84315"
          strokeWidth="1"
        />
        
        {/* ===== INDICADOR DE ESTADO ===== */}
        <circle 
          cx="35" 
          cy="8" 
          r="2" 
          fill={colors.pulse}
          stroke="#fff"
          strokeWidth="1"
        />
        
        {/* Símbolo del estado */}
        {status === 'loading' && (
          <text x="35" y="10" textAnchor="middle" fontSize="6" fill="#fff">↑</text>
        )}
        {status === 'unloading' && (
          <text x="35" y="10" textAnchor="middle" fontSize="6" fill="#fff">↓</text>
        )}
        {status === 'active' && (
          <text x="35" y="10" textAnchor="middle" fontSize="6" fill="#fff">→</text>
        )}
      </svg>
      
      {/* Tooltip con información */}
      <div
        style={{
          position: 'absolute',
          top: '-35px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none'
        }}
        className="truck-tooltip"
      >
        {truckId} - {load}% - {status}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        
        div:hover .truck-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default function GoogleMapStatic({ initialCenter, initialZoom }: GoogleMapStaticProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);

  // Calcular las rotaciones para cada punto
  const getRotationForPoint = (index: number): number => {
    if (index === points.length - 1) {
      if (index > 0) {
        return calculateBearing(points[index - 1], points[index]);
      }
      return 0;
    }
    return calculateBearing(points[index], points[index + 1]);
  };

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    console.log('Map loaded');
  };

  const handleTruckClick = (truckId: string) => {
    setSelectedTruck(truckId);
    console.log('Truck selected:', truckId);
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={containerStyle}>
        {/* Panel de información */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxWidth: '250px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Estado de Volquetes</h3>
          {points.map((point, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '5px',
              backgroundColor: selectedTruck === point.truckId ? '#e3f2fd' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer'
            }} onClick={() => handleTruckClick(point.truckId || '')}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: point.status === 'active' ? '#4caf50' : 
                               point.status === 'loading' ? '#ff9800' :
                               point.status === 'unloading' ? '#f44336' : '#757575',
                marginRight: '8px'
              }} />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>
                {point.truckId}: {point.status} ({point.load}%)
              </span>
            </div>
          ))}
          
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
            <div>🟢 Activo | 🟠 Cargando</div>
            <div>🔴 Descargando | ⚫ Inactivo</div>
          </div>
        </div>

        <Map
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          mapId={import.meta.env.VITE_MAP_ID as string}
          style={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: true,
            scrollwheel: true,
            draggable: true,
            fullscreenControl: true,
            mapTypeControl: true,
            gestureHandling: "greedy",
          }}
          onLoad={onMapLoad}
          onClick={(e) => console.log('Map clicked', e)}
        >
          {points.map((point, idx) => (
            <AdvancedMarker key={idx} position={point}>
              <TruckIcon 
                rotation={getRotationForPoint(idx)}
                status={point.status}
                load={point.load}
                truckId={point.truckId}
                onClick={() => handleTruckClick(point.truckId || '')}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}