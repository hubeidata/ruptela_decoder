import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useGpsContext } from "../context/GpsContext";
import { TruckPoint, GoogleMapStaticProps } from "../types/map.types";
import { containerStyle, modalStyles } from "../styles/mapStyles";
import { getStatusFromSpeed, getStatusText, formatTimestamp, getRotationForPoint } from "../utils/mapUtils";

export default function GoogleMapStatic({ initialCenter, initialZoom }: GoogleMapStaticProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { gpsMap } = useGpsContext();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [modalTruck, setModalTruck] = useState<TruckPoint | null>(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  
  // ← AGREGADO: Estado para almacenar la imagen del volquete como base64
  const [volqueteBase64, setVolqueteBase64] = useState<string>('');

  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  useEffect(() => {
    console.log('[MAP] Debug - gpsMap keys:', Object.keys(gpsMap).length);
    console.log('[MAP] Debug - gpsMap contents:', gpsMap);
  }, [gpsMap]);

  // ← AGREGADO: useEffect para cargar la imagen del volquete como base64
  useEffect(() => {
    const loadVolqueteImage = async () => {
      try {
        console.log('[MAP] 🔄 Cargando imagen del volquete...');
        const response = await fetch('/volquete_sin_fondo.png');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onload = () => {
          setVolqueteBase64(reader.result as string);
          console.log('[MAP] ✅ Imagen volquete cargada como base64 exitosamente');
        };
        
        reader.onerror = () => {
          console.error('[MAP] ❌ Error al leer la imagen como base64');
          // Fallback: usar emoji de camión
          setVolqueteBase64('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="6" y="24" font-size="20">🚛</text></svg>'));
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('[MAP] ❌ Error cargando imagen volquete:', error);
        // Fallback: usar emoji de camión
        setVolqueteBase64('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="6" y="24" font-size="20">🚛</text></svg>'));
      }
    };

    loadVolqueteImage();
  }, []); // Solo se ejecuta una vez al montar el componente

  // useMemo para optimizar creación de puntos
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

  // ← MEJORADO: Función para generar ícono SVG personalizado con imagen base64
  const getCustomTruckIcon = useCallback((point: TruckPoint) => {
    // Si la imagen aún no se ha cargado, retornar un ícono temporal
    if (!volqueteBase64) {
      console.log('[MAP] ⏳ Esperando carga de imagen base64...');
      return 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
          <circle cx="30" cy="30" r="20" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
          <text x="30" y="36" text-anchor="middle" font-size="20">🚛</text>
        </svg>
      `);
    }

    // Colores según estado (igual que tu TruckImageIcon original)
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
    const rotation = getRotationForPoint(point, realTimePoints) - 90; // Ajuste igual que tu componente
    const isActive = point.status !== 'idle';

    // Badge icon según estado (igual que tu componente original)
    const badgeIcon = point.status === 'loading' ? 'L' : 
                     point.status === 'active' ? 'A' : 'I';

    // SVG con tu imagen base64 y todos los efectos originales
    const svg = `
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <!-- Animación de pulso para camiones activos (igual que tu diseño) -->
        ${isActive ? `
        <circle cx="30" cy="30" r="25" 
                fill="${colors.pulse}" 
                opacity="0.3">
          <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
        ` : ''}
        
        <!-- Círculo principal con borde colorido (igual que tu diseño) -->
        <circle cx="30" cy="30" r="20" 
                fill="${colors.bg}" 
                stroke="${colors.border}" 
                stroke-width="3"
                filter="drop-shadow(0 0 8px ${colors.border}40)"/>
        
        <!-- TU IMAGEN DE VOLQUETE con rotación -->
        <g transform="translate(30,30) rotate(${rotation}) translate(-16,-16)">
          <image href="${volqueteBase64}" 
                 x="0" y="0" width="32" height="32"/>
        </g>
        
        <!-- Badge de estado (igual que tu diseño) -->
        <circle cx="45" cy="15" r="8" 
                fill="${colors.border}"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <text x="45" y="19" text-anchor="middle" 
              fill="white" font-size="10" font-family="Arial" font-weight="bold">
          ${badgeIcon}
        </text>
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [realTimePoints, volqueteBase64]); // ← IMPORTANTE: Incluir volqueteBase64 como dependencia

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

  // useCallback para optimizar función de click
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
  console.log('[MAP] Estado volquete base64:', volqueteBase64 ? 'Cargado ✅' : 'Pendiente ⏳');

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
              <Marker
                key={`marker-${point.imei}`}
                position={{ lat: point.lat, lng: point.lng }}
                icon={{
                  url: getCustomTruckIcon(point), // ← TU VOLQUETE EN BASE64
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