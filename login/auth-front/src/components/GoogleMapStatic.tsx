import React, { useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface GoogleMapStaticProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

interface TruckPoint {
  lat: number;
  lng: number;
  status?: 'active' | 'loading' | 'idle';
  truckId?: string;
}

const containerStyle = {
  position: "relative",
  width: "100%",
  height: "calc(100vh - 60px)",
  marginTop: "60px",
  pointerEvents: "auto",
};

const points: TruckPoint[] = [
  { lat: -16.410471, lng: -71.53088, status: 'loading', truckId: 'T001' },
  { lat: -16.409, lng: -71.528, status: 'active', truckId: 'T002' },
  { lat: -16.412, lng: -71.532, status: 'active', truckId: 'T003' },
  { lat: -16.4135, lng: -71.5295, status: 'idle', truckId: 'T004' },
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

// Componente del volquete con imagen
const TruckImageIcon = ({ 
  rotation = 0, 
  status = 'idle',
  truckId = '',
  onClick 
}: { 
  rotation?: number;
  status?: 'active' | 'loading' | 'idle';
  truckId?: string;
  onClick?: () => void;
}) => {
  // Colores según el estado
  const getStatusColors = () => {
    switch (status) {
      case 'active':
        return { border: '#4caf50', shadow: '#81c784', pulse: '#c8e6c9' };
      case 'loading':
        return { border: '#ff9800', shadow: '#ffb74d', pulse: '#ffe0b2' };
      default:
        return { border: '#757575', shadow: '#bdbdbd', pulse: '#f5f5f5' };
    }
  };

  const colors = getStatusColors();
  const isActive = status !== 'idle';
  
  return (
    <div 
      style={{ 
        transform: `rotate(${rotation}deg)`, 
        transformOrigin: 'center',
        cursor: 'pointer',
        position: 'relative',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClick}
    >
      {/* Pulso animado para estados activos */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '-15px',
            left: '-15px',
            width: '90px',
            height: '90px',
            backgroundColor: colors.pulse,
            borderRadius: '50%',
            opacity: 0.4,
            animation: 'pulse 2s infinite',
            zIndex: -1
          }}
        />
      )}
      
      {/* Contenedor de la imagen con borde de estado */}
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: `3px solid ${colors.border}`,
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 15px ${colors.shadow}`,
          overflow: 'hidden'
        }}
      >
        {/* Imagen del volquete - REEMPLAZA LA URL CON TU IMAGEN */}
        <img
          src="/volquete_sin_fondo.png" 
          alt="Volquete minero"
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
      </div>
      
      {/* Indicador de estado en la esquina */}
      <div
        style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: colors.border,
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        {status === 'loading' && '↓'}
        {status === 'active' && '→'}
        {status === 'idle' && '⏸'}
      </div>
      
      {/* Tooltip con información */}
      <div
        style={{
          position: 'absolute',
          top: '-45px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          zIndex: 1000
        }}
        className="truck-tooltip"
      >
        <div style={{ fontWeight: 'bold' }}>{truckId}</div>
        <div style={{ fontSize: '9px', color: '#ccc' }}>
          {status === 'active' && 'En movimiento'}
          {status === 'loading' && 'Cargando material'}
          {status === 'idle' && 'Inactivo'}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.4;
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En movimiento';
      case 'loading': return 'Cargando';
      case 'idle': return 'Inactivo';
      default: return 'Desconocido';
    }
  };

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={containerStyle}>
        {/* Panel de información simplificado */}
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
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
            🚛 Estado de Volquetes
          </h3>
          
          {points.map((point, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: selectedTruck === point.truckId ? '#e3f2fd' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.3s'
            }} 
            onClick={() => handleTruckClick(point.truckId || '')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTruck === point.truckId ? '#e3f2fd' : 'transparent'}
            >
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: point.status === 'active' ? '#4caf50' : 
                               point.status === 'loading' ? '#ff9800' : '#757575',
                marginRight: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                  {point.truckId}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {getStatusText(point.status || 'idle')}
                </div>
              </div>
            </div>
          ))}
          
          <div style={{ 
            marginTop: '15px', 
            paddingTop: '15px',
            borderTop: '1px solid #eee',
            fontSize: '10px', 
            color: '#666' 
          }}>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#4caf50' }}>●</span> En movimiento
            </div>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#ff9800' }}>●</span> Cargando material
            </div>
            <div>
              <span style={{ color: '#757575' }}>●</span> Inactivo
            </div>
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
              <TruckImageIcon 
                rotation={getRotationForPoint(idx)}
                status={point.status}
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