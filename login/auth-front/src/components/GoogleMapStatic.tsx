import React, { useRef, useState, useEffect, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useGpsContext } from "../context/GpsContext";
import { TruckPoint, GoogleMapStaticProps } from "../types/map.types";
import { containerStyle, modalStyles } from "../styles/mapStyles";
import { getStatusFromSpeed, getStatusText, formatTimestamp, getRotationForPoint } from "../utils/mapUtils";
import { MapHeader } from "./MapHeader";
import { TruckImageIcon } from "./TruckImageIcon";

export default function GoogleMapStatic({ initialCenter, initialZoom }: GoogleMapStaticProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { gpsMap } = useGpsContext();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [modalTruck, setModalTruck] = useState<TruckPoint | null>(null);
  const [panelExpanded, setPanelExpanded] = useState<boolean>(false);
  const [realTimePoints, setRealTimePoints] = useState<TruckPoint[]>([]);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [hasReceivedFirstPoint, setHasReceivedFirstPoint] = useState(false);

  // Convertir datos GPS del contexto a TruckPoint y centrar mapa en el primer registro
  useEffect(() => {
    const points: TruckPoint[] = [];
    
    if (gpsMap.size === 0) {
      setRealTimePoints([]);
      console.log('[MAP] No hay datos GPS disponibles');
      return;
    }

    gpsMap.forEach((gpsData, imei) => {
      const point: TruckPoint = {
        lat: gpsData.lat,
        lng: gpsData.lng,
        imei: imei,
        truckId: `T-${imei.slice(-4)}`,
        status: getStatusFromSpeed(gpsData.speed || 0),
        speed: gpsData.speed,
        timestamp: gpsData.timestamp,
        altitude: gpsData.altitude,
        angle: gpsData.angle,
        satellites: gpsData.satellites,
        hdop: gpsData.hdop,
        additionalData: gpsData.additionalData,
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

    // Centrar el mapa en el primer punto recibido (solo la primera vez)
    if (!hasReceivedFirstPoint && points.length > 0) {
      const firstPoint = points[0];
      const newCenter = { lat: firstPoint.lat, lng: firstPoint.lng };
      setMapCenter(newCenter);
      setHasReceivedFirstPoint(true);
      
      if (mapRef.current) {
        mapRef.current.panTo(newCenter);
        mapRef.current.setZoom(15);
      }
      
      console.log(`[MAP] 🎯 Centrando mapa en primer registro GPS:`, newCenter);
      console.log(`[MAP] 📍 IMEI: ${firstPoint.imei}, Truck: ${firstPoint.truckId}`);
    }

    setRealTimePoints(points);
    console.log(`[MAP] Actualizando mapa con ${points.length} puntos GPS reales`);
    
  }, [gpsMap, hasReceivedFirstPoint]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    console.log('[MAP] Mapa cargado');
    
    if (realTimePoints.length > 0 && !hasReceivedFirstPoint) {
      const firstPoint = realTimePoints[0];
      const newCenter = { lat: firstPoint.lat, lng: firstPoint.lng };
      map.panTo(newCenter);
      map.setZoom(15);
      setMapCenter(newCenter);
      setHasReceivedFirstPoint(true);
      console.log('[MAP] 🎯 Centrando mapa en carga con datos existentes:', newCenter);
    }
  }, [realTimePoints, hasReceivedFirstPoint]);

  const handleTruckClick = (truckData: TruckPoint) => {
    setSelectedTruck(truckData.truckId || truckData.imei || '');
    setModalTruck(truckData);
    console.log('[MAP] Volquete seleccionado:', truckData.truckId || truckData.imei);
  };

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

  return (
    <APIProvider apiKey={import.meta.env.VITE_API_MAPS as string}>
      <div style={containerStyle}>
        <MapHeader
          realTimePoints={realTimePoints}
          panelExpanded={panelExpanded}
          setPanelExpanded={setPanelExpanded}
          selectedTruck={selectedTruck}
          onTruckClick={handleTruckClick}
        />

        <Map
          center={mapCenter}
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
          {realTimePoints.length > 0 && realTimePoints.map((point, idx) => (
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

        {/* Modal simplificado - puedes moverlo a otro componente si deseas */}
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
                }} onClick={() => centerMapOnTruck(modalTruck)}>
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