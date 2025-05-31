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

const containerStyle = {
  position: "relative",
  width: "100%",
  height: "calc(100vh - 60px)",
  marginTop: "60px",
  pointerEvents: "auto",
};

const points: TruckPoint[] = [
  { 
    lat: -16.410471, 
    lng: -71.53088, 
    status: 'loading', 
    truckId: 'T001',
    operator: {
      name: 'Carlos Mendoza',
      age: 34,
      license: 'A3-456789',
      experience: '8 años',
      shift: 'Día (06:00-18:00)',
      contact: '+51 987 654 321'
    },
    truckInfo: {
      model: 'Caterpillar 797F',
      capacity: '400 toneladas',
      year: 2019,
      maintenance: 'Al día'
    }
  },
  { 
    lat: -16.409, 
    lng: -71.528, 
    status: 'active', 
    truckId: 'T002',
    operator: {
      name: 'Ana Quispe',
      age: 29,
      license: 'A3-123456',
      experience: '5 años',
      shift: 'Día (06:00-18:00)',
      contact: '+51 987 123 456'
    },
    truckInfo: {
      model: 'Komatsu 980E-4',
      capacity: '380 toneladas',
      year: 2020,
      maintenance: 'Próxima: 15/06/25'
    }
  },
  { 
    lat: -16.412, 
    lng: -71.532, 
    status: 'active', 
    truckId: 'T003',
    operator: {
      name: 'Miguel Torres',
      age: 42,
      license: 'A3-789012',
      experience: '12 años',
      shift: 'Noche (18:00-06:00)',
      contact: '+51 987 789 012'
    },
    truckInfo: {
      model: 'Liebherr T 282C',
      capacity: '365 toneladas',
      year: 2018,
      maintenance: 'En revisión'
    }
  },
  { 
    lat: -16.4135, 
    lng: -71.5295, 
    status: 'idle', 
    truckId: 'T004',
    operator: {
      name: 'Rosa Mamani',
      age: 31,
      license: 'A3-345678',
      experience: '6 años',
      shift: 'Día (06:00-18:00)',
      contact: '+51 987 345 678'
    },
    truckInfo: {
      model: 'Caterpillar 797B',
      capacity: '380 toneladas',
      year: 2017,
      maintenance: 'Al día'
    }
  },
];

// Función para calcular el ángulo entre dos puntos
const calculateBearing = (start: {lat: number, lng: number}, end: {lat: number, lng: number}): number => {
  // Calcular la dirección usando coordenadas simples (para el mapa)
  const deltaLng = end.lng - start.lng;
  const deltaLat = end.lat - start.lat;
  
  // Calcular el ángulo en radianes
  let angle = Math.atan2(deltaLng, deltaLat);
  
  // Convertir a grados
  let degrees = angle * (180 / Math.PI);
  
  // Ajustar para que 0° sea hacia arriba (norte)
  // y la rotación sea en sentido horario
  degrees = (90 - degrees + 360) % 360;
  
  return degrees;
};

// Componente del volquete con imagen
const TruckImageIcon = ({ 
  rotation = 0, 
  status = 'idle',
  truckData,
  onClick 
}: { 
  rotation?: number;
  status?: 'active' | 'loading' | 'idle';
  truckData?: TruckPoint;
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
        // NO rotar el contenedor completo - esto causaba el problema
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
        {/* Imagen del volquete con rotación controlada */}
        <img
          src="/volquete_sin_fondo.png"
          alt="Volquete minero"
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            objectPosition: 'center',
            // APLICAR ROTACIÓN SOLO A LA IMAGEN
            // Como tu imagen apunta hacia la derecha, restamos 90° para que apunte hacia arriba por defecto
            transform: `rotate(${rotation - 90}deg)`,
            transformOrigin: 'center',
            // Evitar distorsión manteniendo proporción
            imageRendering: 'auto',
            // Suavizar la rotación
            transition: 'transform 0.3s ease'
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
      
      {/* Tooltip mínimo en hover - SIEMPRE HORIZONTAL */}
      <div
        style={{
          position: 'absolute',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)', // Ya no necesitamos contra-rotación
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          zIndex: 1000,
          border: `1px solid ${colors.border}`
        }}
        className="truck-tooltip"
      >
        {truckData?.truckId}
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
  const [modalTruck, setModalTruck] = useState<TruckPoint | null>(null);
  const [panelExpanded, setPanelExpanded] = useState<boolean>(false);

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

  const handleTruckClick = (truckData: TruckPoint) => {
    setSelectedTruck(truckData.truckId || '');
    setModalTruck(truckData);
    console.log('Truck selected:', truckData.truckId);
  };

  const closeModal = () => {
    setModalTruck(null);
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
        {/* Panel de información desplegable */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          maxWidth: panelExpanded ? '280px' : '60px',
          width: panelExpanded ? '280px' : '60px'
        }}>
          
          {/* Botón de toggle siempre visible */}
          <div style={{
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: panelExpanded ? 'space-between' : 'center',
            borderBottom: panelExpanded ? '1px solid #eee' : 'none',
            cursor: 'pointer',
            backgroundColor: panelExpanded ? 'transparent' : '#f8f9fa'
          }} onClick={() => setPanelExpanded(!panelExpanded)}>
            
            {panelExpanded && (
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                🚛 Estado de Volquetes
              </h3>
            )}
            
            <button style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s',
              transform: panelExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              {panelExpanded ? '←' : '📊'}
            </button>
          </div>

          {/* Contenido del panel - solo visible cuando está expandido */}
          <div style={{
            maxHeight: panelExpanded ? '450px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
            padding: panelExpanded ? '15px' : '0px'
          }}>
            
            {/* HERRAMIENTA DE DEBUG PARA ORIENTACIÓN */}
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #4caf50'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32', marginBottom: '8px' }}>
                🔧 Debug Orientación
              </div>
              <div style={{ fontSize: '10px', color: '#2e7d32', marginBottom: '5px' }}>
                Ángulos calculados para cada volquete:
              </div>
              <div style={{ fontSize: '9px', color: '#1b5e20' }}>
                {points.map((point, idx) => {
                  const rotation = getRotationForPoint(idx);
                  return (
                    <div key={idx}>
                      {point.truckId}: {rotation.toFixed(1)}°
                    </div>
                  );
                })}
              </div>
            </div>
            
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
              onClick={() => handleTruckClick(point)}
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
                truckData={point}
                onClick={() => handleTruckClick(point)}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {/* Modal de detalles del volquete */}
        {modalTruck && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }} onClick={closeModal}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '25px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Botón cerrar */}
              <button onClick={closeModal} style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '5px',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>×</button>

              {/* Header del modal */}
              <div style={{
                borderBottom: '2px solid #eee',
                paddingBottom: '20px',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  margin: '0 0 10px 0',
                  fontSize: '24px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  🚛 {modalTruck.truckId}
                  <span style={{
                    marginLeft: '15px',
                    fontSize: '14px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: 'white',
                    backgroundColor: modalTruck.status === 'active' ? '#4caf50' : 
                                   modalTruck.status === 'loading' ? '#ff9800' : '#757575'
                  }}>
                    {modalTruck.status === 'active' && 'En movimiento'}
                    {modalTruck.status === 'loading' && 'Cargando'}
                    {modalTruck.status === 'idle' && 'Inactivo'}
                  </span>
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Información detallada del volquete y operador
                </p>
              </div>

              {/* Información del operador */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  👤 Información del Operador
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px'
                }}>
                  <div>
                    <strong style={{ color: '#495057' }}>Nombre:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.operator?.name}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#495057' }}>Edad:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.operator?.age} años</div>
                  </div>
                  <div>
                    <strong style={{ color: '#495057' }}>Licencia:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.operator?.license}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#495057' }}>Experiencia:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.operator?.experience}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#495057' }}>Turno:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.operator?.shift}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#495057' }}>Contacto:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.operator?.contact}</div>
                  </div>
                </div>
              </div>

              {/* Información del volquete */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  🔧 Información del Volquete
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: '#fff3cd',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ffeaa7'
                }}>
                  <div>
                    <strong style={{ color: '#856404' }}>Modelo:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.truckInfo?.model}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#856404' }}>Capacidad:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.truckInfo?.capacity}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#856404' }}>Año:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.truckInfo?.year}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#856404' }}>Mantenimiento:</strong>
                    <div style={{ 
                      color: modalTruck.truckInfo?.maintenance === 'Al día' ? '#28a745' : 
                             modalTruck.truckInfo?.maintenance === 'En revisión' ? '#dc3545' : '#ffc107', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {modalTruck.truckInfo?.maintenance}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación actual */}
              <div style={{
                backgroundColor: '#e7f3ff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #b3d9ff'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>📍 Ubicación Actual</h4>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <strong>Latitud:</strong> {modalTruck.lat.toFixed(6)}<br/>
                  <strong>Longitud:</strong> {modalTruck.lng.toFixed(6)}
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{
                marginTop: '25px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end'
              }}>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }} onClick={closeModal}>
                  Cerrar
                </button>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }} onClick={() => console.log('Contactar operador:', modalTruck.operator?.name)}>
                  📞 Contactar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}