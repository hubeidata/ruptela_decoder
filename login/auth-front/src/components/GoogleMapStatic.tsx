import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"; // ← CAMBIADO: Marker en lugar de AdvancedMarker
import { useGpsContext } from "../context/GpsContext";
import { TruckPoint, GoogleMapStaticProps } from "../types/map.types";
import { containerStyle, modalStyles } from "../styles/mapStyles";
import { getStatusFromSpeed, getStatusText, formatTimestamp, getRotationForPoint } from "../utils/mapUtils";
// ← ELIMINADO: import { TruckImageIcon } from "./TruckImageIcon"; (ya no se necesita)

export default function GoogleMapStatic({ initialCenter, initialZoom }: GoogleMapStaticProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { gpsMap } = useGpsContext();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [modalTruck, setModalTruck] = useState<TruckPoint | null>(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);

  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  useEffect(() => {
    console.log('[MAP] Debug - gpsMap keys:', Object.keys(gpsMap).length);
    console.log('[MAP] Debug - gpsMap contents:', gpsMap);
  }, [gpsMap]);

  // ← AGREGADO: useMemo para optimizar creación de puntos
  const realTimePoints = useMemo(() => {
    console.log('[MAP] 🔄 Recreando array de puntos por cambio en GPS data');
    const points: TruckPoint[] = Object.values(gpsMap).map(gpsData => ({
      lat: gpsData.lat,
      lng: gpsData.lng,
      imei: gpsData.imei,
      truckId: `T-${gpsData.imei.slice(-4)}`,
      status: getStatusFromSpeed(gpsData.speed || 0),
      speed: gpsData.speed,
      timestamp: gpsData.timestamp,
      altitude: gpsData.altitude,
      angle: gpsData.angle,
      satellites: gpsData.satellites,
      hdop: gpsData.hdop,
      additionalData: gpsData.additionalData,
      operator: {
        name: `Operador ${gpsData.imei.slice(-4)}`,
        age: 30,
        license: `A3-${gpsData.imei.slice(-6)}`,
        experience: '5 años',
        shift: 'Día (06:00-18:00)',
        contact: `+51 987 ${gpsData.imei.slice(-6)}`
      },
      truckInfo: {
        model: 'Volquete GPS',
        capacity: 'N/A',
        year: 2020,
        maintenance: 'Monitoreado'
      }
    }));
    return points;
  }, [gpsMap]);

  // ← AGREGADO: Función para generar ícono SVG personalizado con tu volquete
  const getCustomTruckIcon = useCallback((point: TruckPoint) => {
    // Colores según estado (igual que tu TruckImageIcon)
    const getColors = (status: string) => {
      switch (status) {
        case 'active': 
          return { border: '#4caf50', bg: '#e8f5e8', pulse: '#4caf50' };
        case 'loading': 
          return { border: '#ff9800', bg: '#fff3e0', pulse: '#ff9800' };
        default: 
          return { border: '#757575', bg: '#f5f5f5', pulse: '#757575' };
      }
    };

    const colors = getColors(point.status);
    const rotation = getRotationForPoint(point, realTimePoints) - 90; // Igual que tu componente
    const isActive = point.status !== 'idle';

    // Badge icon según estado (igual que tu componente)
    const badgeIcon = point.status === 'loading' ? '↓' : 
                     point.status === 'active' ? '→' : '⏸';

    // SVG con todos los efectos de tu TruckImageIcon
    const svg = `
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <!-- Animación de pulso para camiones activos -->
        ${isActive ? `
        <circle cx="30" cy="30" r="25" 
                fill="${colors.pulse}" 
                opacity="0.3">
          <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
        ` : ''}
        
        <!-- Círculo principal con borde colorido -->
        <circle cx="30" cy="30" r="20" 
                fill="${colors.bg}" 
                stroke="${colors.border}" 
                stroke-width="3"
                filter="drop-shadow(0 0 8px ${colors.border}40)"/>
        
        <!-- Tu imagen de volquete con rotación -->
        <g transform="translate(30,30) rotate(${rotation}) translate(-16,-16)">
          <image href="/volquete_sin_fondo.png" 
                 x="0" y="0" width="32" height="32"/>
        </g>
        
        <!-- Badge de estado -->
        <circle cx="45" cy="15" r="8" 
                fill="${colors.border}"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <text x="45" y="19" text-anchor="middle" 
              fill="white" font-size="10" font-family="Arial" font-weight="bold">
          ${badgeIcon}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, [realTimePoints]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    console.log('[MAP] Mapa cargado correctamente');

    listenersRef.current.forEach(listener => listener.remove());
    listenersRef.current = [];

    listenersRef.current.push(
      map.addListener('dragstart', () => {
        console.log('[MAP] 🖱️ El usuario comenzó a mover el mapa (dragstart)');
      })
    );
    listenersRef.current.push(
      map.addListener('drag', () => {
        console.log('[MAP] 🖱️ El usuario está moviendo el mapa (drag)');
      })
    );
    listenersRef.current.push(
      map.addListener('dragend', () => {
        const center = map.getCenter();
        if (center) {
          console.log('[MAP] 🖱️ El usuario terminó de mover el mapa (dragend). Nuevo centro:', {
            lat: center.lat(),
            lng: center.lng(),
          });
        }
      })
    );
  }, []);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach(listener => listener.remove());
      listenersRef.current = [];
    };
  }, []);

  useEffect(() => {
    console.log('[MAP] realTimePoints updated:', realTimePoints.length, realTimePoints);
  }, [realTimePoints]);

  // ← AGREGADO: useCallback para optimizar función de click
  const handleTruckClick = useCallback((truckData: TruckPoint) => {
    setSelectedTruck(truckData.truckId || truckData.imei || '');
    setModalTruck(truckData);
    console.log('[MAP] Volquete seleccionado:', truckData.truckId || truckData.imei);
  }, []);

  const closeModal = () => {
    setModalTruck(null);
  };

  const centerMapOnTruck = (truckData: TruckPoint) => {
    if (mapRef.current) {
      const position = { lat: truckData.lat, lng: truckData.lng };
      mapRef.current.panTo(position);
      mapRef.current.setZoom(16);
      console.log(`[MAP] 📍 Centrando mapa en ${truckData.truckId}:`, position);
    }
    closeModal();
  };

  console.log('[MAP] Renderizando componente - realTimePoints.length:', realTimePoints.length);

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
      }}>
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
          {console.log('[MAP] Renderizando markers - cantidad:', realTimePoints.length)}
          {realTimePoints.length > 0 && realTimePoints.map((point) => {
            console.log(`[MAP] Renderizando marker personalizado:`, point);
            return (
              <Marker // ← CAMBIADO: Marker en lugar de AdvancedMarker
                key={`marker-${point.imei}`}
                position={{ lat: point.lat, lng: point.lng }}
                icon={{
                  url: getCustomTruckIcon(point), // ← TU VOLQUETE PERSONALIZADO
                  scaledSize: new google.maps.Size(60, 60),
                  anchor: new google.maps.Point(30, 30), // Centro del ícono
                }}
                title={`${point.truckId} - ${getStatusText(point.status || 'idle')} - ${point.speed || 0} km/h`}
                onClick={() => handleTruckClick(point)}
              />
            );
          })}
        </Map>

        {/* Modal - Sin cambios */}
        {modalTruck && (
          <div style={modalStyles.overlay} onClick={closeModal}>
            <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} style={modalStyles.closeButton}>×</button>

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

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                backgroundColor: '#f0f8ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div>
                  <strong>Velocidad:</strong> {modalTruck.speed || 0} km/h
                </div>
                <div>
                  <strong>Ubicación:</strong> {modalTruck.lat.toFixed(6)}, {modalTruck.lng.toFixed(6)}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end'
              }}>
                <button onClick={closeModal} style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  Cerrar
                </button>
                <button onClick={() => centerMapOnTruck(modalTruck)} style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
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