import React, { useRef, useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useGpsContext } from "../context/GpsContext";

interface GoogleMapStaticProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

interface TruckPoint {
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

const containerStyle = {
  position: "relative",
  width: "100%",
  height: "calc(100vh - 60px)",
  marginTop: "60px",
  pointerEvents: "auto",
};

// Función para determinar el estado basado en la velocidad
const getStatusFromSpeed = (speed: number): 'active' | 'loading' | 'idle' => {
  if (speed > 5) return 'active';
  if (speed > 0) return 'loading';
  return 'idle';
};

// Función para calcular el ángulo entre dos puntos
const calculateBearing = (start: {lat: number, lng: number}, end: {lat: number, lng: number}): number => {
  const deltaLng = end.lng - start.lng;
  const deltaLat = end.lat - start.lat;
  
  let angle = Math.atan2(deltaLng, deltaLat);
  let degrees = angle * (180 / Math.PI);
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
        <img
          src="/volquete_sin_fondo.png"
          alt="Volquete minero"
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            objectPosition: 'center',
            transform: `rotate(${rotation - 90}deg)`,
            transformOrigin: 'center',
            imageRendering: 'auto',
            transition: 'transform 0.3s ease'
          }}
        />
      </div>
      
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
      
      <div
        style={{
          position: 'absolute',
          top: '-25px',
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
          pointerEvents: 'none',
          zIndex: 1000,
          border: `1px solid ${colors.border}`
        }}
        className="truck-tooltip"
      >
        {truckData?.truckId || truckData?.imei}
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
  const { gpsMap } = useGpsContext(); // ← Usar el contexto GPS
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [modalTruck, setModalTruck] = useState<TruckPoint | null>(null);
  const [panelExpanded, setPanelExpanded] = useState<boolean>(false);
  const [realTimePoints, setRealTimePoints] = useState<TruckPoint[]>([]);

  // Convertir datos GPS del contexto a TruckPoint
  useEffect(() => {
    const points: TruckPoint[] = [];
    
    gpsMap.forEach((gpsData, imei) => {
      const point: TruckPoint = {
        lat: gpsData.lat,
        lng: gpsData.lng,
        imei: imei,
        truckId: `T-${imei.slice(-4)}`, // Usar los últimos 4 dígitos del IMEI
        status: getStatusFromSpeed(gpsData.speed || 0),
        speed: gpsData.speed,
        timestamp: gpsData.timestamp,
        altitude: gpsData.altitude,
        angle: gpsData.angle,
        satellites: gpsData.satellites,
        hdop: gpsData.hdop,
        additionalData: gpsData.additionalData,
        // Datos por defecto del operador (puedes personalizar según tu lógica)
        operator: {
          name: `Operador ${imei.slice(-4)}`,
          age: 30,
          license: `A3-${imei.slice(-6)}`,
          experience: '5 años',
          shift: 'Día (06:00-18:00)',
          contact: `+51 987 ${imei.slice(-6)}`
        },
        truckInfo: {
          model: 'Volquete GPS',
          capacity: 'N/A',
          year: 2020,
          maintenance: 'Monitoreado'
        }
      };
      points.push(point);
    });

    setRealTimePoints(points);
    
    // Log para debugging
    console.log(`[MAP] Actualizando mapa con ${points.length} puntos GPS reales`);
    points.forEach(point => {
      console.log(`[MAP] 📍 ${point.truckId}: ${point.lat}, ${point.lng} - ${point.speed} km/h`);
    });
    
  }, [gpsMap]);

  // Calcular las rotaciones para cada punto
  const getRotationForPoint = (point: TruckPoint, points: TruckPoint[]): number => {
    // Si tenemos el ángulo del GPS, usarlo
    if (point.angle !== undefined && point.angle !== null) {
      return point.angle;
    }
    
    // Si no, usar el método anterior de calcular entre puntos
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

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    console.log('[MAP] Mapa cargado');
  };

  const handleTruckClick = (truckData: TruckPoint) => {
    setSelectedTruck(truckData.truckId || truckData.imei || '');
    setModalTruck(truckData);
    console.log('[MAP] Volquete seleccionado:', truckData.truckId || truckData.imei);
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

  const formatTimestamp = (timestamp: string) => {
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
          maxWidth: panelExpanded ? '320px' : '60px',
          width: panelExpanded ? '320px' : '60px'
        }}>
          
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
                🚛 Volquetes GPS ({realTimePoints.length})
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

          <div style={{
            maxHeight: panelExpanded ? '450px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
            padding: panelExpanded ? '15px' : '0px'
          }}>
            
            {/* Información en tiempo real */}
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: '1px solid #4caf50'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32', marginBottom: '8px' }}>
                📡 Datos en Tiempo Real
              </div>
              <div style={{ fontSize: '10px', color: '#2e7d32' }}>
                Dispositivos conectados: {realTimePoints.length}
              </div>
              <div style={{ fontSize: '10px', color: '#2e7d32' }}>
                Última actualización: {realTimePoints.length > 0 ? 'Ahora' : 'N/A'}
              </div>
            </div>
            
            {realTimePoints.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#666', 
                fontSize: '12px',
                padding: '20px'
              }}>
                ⏳ Esperando datos GPS...
              </div>
            ) : (
              realTimePoints.map((point, idx) => (
                <div key={point.imei || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                  padding: '8px',
                  backgroundColor: selectedTruck === (point.truckId || point.imei) ? '#e3f2fd' : 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.3s'
                }} 
                onClick={() => handleTruckClick(point)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTruck === (point.truckId || point.imei) ? '#e3f2fd' : 'transparent'}
                >
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: point.status === 'active' ? '#4caf50' : 
                                   point.status === 'loading' ? '#ff9800' : '#757575',
                    marginRight: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    animation: point.status === 'active' ? 'pulse 2s infinite' : 'none'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                      {point.truckId} ({point.imei?.slice(-4)})
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {getStatusText(point.status || 'idle')} - {point.speed || 0} km/h
                    </div>
                    <div style={{ fontSize: '10px', color: '#999' }}>
                      {point.timestamp ? formatTimestamp(point.timestamp) : 'Sin timestamp'}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px',
              borderTop: '1px solid #eee',
              fontSize: '10px', 
              color: '#666' 
            }}>
              <div style={{ marginBottom: '5px' }}>
                <span style={{ color: '#4caf50' }}>●</span> En movimiento (>5 km/h)
              </div>
              <div style={{ marginBottom: '5px' }}>
                <span style={{ color: '#ff9800' }}>●</span> Cargando (0-5 km/h)
              </div>
              <div>
                <span style={{ color: '#757575' }}>●</span> Inactivo (0 km/h)
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
          onClick={(e) => console.log('[MAP] Mapa clickeado', e)}
        >
          {realTimePoints.map((point, idx) => (
            <AdvancedMarker key={point.imei || idx} position={point}>
              <TruckImageIcon 
                rotation={getRotationForPoint(point, realTimePoints)}
                status={point.status}
                truckData={point}
                onClick={() => handleTruckClick(point)}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {/* Modal actualizado con datos GPS reales */}
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
                    {getStatusText(modalTruck.status || 'idle')}
                  </span>
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  IMEI: {modalTruck.imei} | Datos GPS en tiempo real
                </p>
              </div>

              {/* Datos GPS en tiempo real */}
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  📡 Datos GPS en Tiempo Real
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  backgroundColor: '#f0f8ff',
                  padding: '15px',
                  borderRadius: '8px'
                }}>
                  <div>
                    <strong style={{ color: '#0066cc' }}>Velocidad:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.speed || 0} km/h</div>
                  </div>
                  <div>
                    <strong style={{ color: '#0066cc' }}>Altitud:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.altitude || 'N/A'} m</div>
                  </div>
                  <div>
                    <strong style={{ color: '#0066cc' }}>Dirección:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.angle || 'N/A'}°</div>
                  </div>
                  <div>
                    <strong style={{ color: '#0066cc' }}>Satélites:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.satellites || 'N/A'}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#0066cc' }}>Precisión (HDOP):</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>{modalTruck.hdop || 'N/A'}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#0066cc' }}>Última actualización:</strong>
                    <div style={{ color: '#333', fontSize: '14px' }}>
                      {modalTruck.timestamp ? formatTimestamp(modalTruck.timestamp) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación actual */}
              <div style={{
                backgroundColor: '#e7f3ff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #b3d9ff',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>📍 Ubicación Actual</h4>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <strong>Latitud:</strong> {modalTruck.lat.toFixed(6)}<br/>
                  <strong>Longitud:</strong> {modalTruck.lng.toFixed(6)}
                </div>
              </div>

              {/* Datos adicionales si existen */}
              {modalTruck.additionalData && (
                <div style={{
                  backgroundColor: '#fff8e1',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ffcc02',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#e65100' }}>🔧 Datos Adicionales del Protocolo</h4>
                  <div style={{ fontSize: '12px', color: '#333', fontFamily: 'monospace' }}>
                    {JSON.stringify(modalTruck.additionalData, null, 2)}
                  </div>
                </div>
              )}

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
                }} onClick={() => console.log('[MAP] Centrando en:', modalTruck.imei)}>
                  📍 Centrar en Mapa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}