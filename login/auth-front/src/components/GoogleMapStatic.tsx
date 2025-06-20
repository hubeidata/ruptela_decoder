import React, { useRef, useState, useEffect, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useGpsContext } from "../context/GpsContext";
import { TruckPoint, GoogleMapStaticProps } from "../types/map.types";
import { containerStyle, modalStyles } from "../styles/mapStyles";
import { getStatusFromSpeed, getStatusText, formatTimestamp, getRotationForPoint } from "../utils/mapUtils";
import { TruckImageIcon } from "./TruckImageIcon";

export default function GoogleMapStatic({ initialCenter, initialZoom }: GoogleMapStaticProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { gpsMap } = useGpsContext();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [modalTruck, setModalTruck] = useState<TruckPoint | null>(null);
  const [realTimePoints, setRealTimePoints] = useState<TruckPoint[]>([]);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [hasReceivedFirstPoint, setHasReceivedFirstPoint] = useState(false);

  // Debug: Log del estado del gpsMap
  useEffect(() => {
    console.log('[MAP] Debug - gpsMap keys:', Object.keys(gpsMap).length);
    console.log('[MAP] Debug - gpsMap contents:', gpsMap);
  }, [gpsMap]);

  // Convertir datos GPS del contexto a TruckPoint
  useEffect(() => {
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

    setRealTimePoints(points);
  }, [gpsMap]);

  // Centrar el mapa solo la primera vez que llegan puntos
  useEffect(() => {
    if (!hasReceivedFirstPoint && realTimePoints.length > 0) {
      const firstPoint = realTimePoints[0];
      const newCenter = { lat: firstPoint.lat, lng: firstPoint.lng };
      setMapCenter(newCenter);
      setHasReceivedFirstPoint(true);

      if (mapRef.current) {
        mapRef.current.panTo(newCenter);
        mapRef.current.setZoom(15);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realTimePoints, hasReceivedFirstPoint]);

  // Debug: Log cuando cambian los realTimePoints
  useEffect(() => {
    console.log('[MAP] realTimePoints updated:', realTimePoints.length, realTimePoints);
  }, [realTimePoints]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    console.log('[MAP] Mapa cargado correctamente');
    // Solo centrar si nunca se centró antes
    if (!hasReceivedFirstPoint && realTimePoints.length > 0) {
      const firstPoint = realTimePoints[0];
      const newCenter = { lat: firstPoint.lat, lng: firstPoint.lng };
      map.panTo(newCenter);
      map.setZoom(15);
      setMapCenter(newCenter);
      setHasReceivedFirstPoint(true);
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
          {console.log('[MAP] Renderizando markers - cantidad:', realTimePoints.length)}
          {realTimePoints.length > 0 && realTimePoints.map((point, idx) => {
            console.log(`[MAP] Renderizando marker ${idx}:`, point);
            return (
              <AdvancedMarker key={point.imei || idx} position={point}>
                <TruckImageIcon 
                  rotation={getRotationForPoint(point, realTimePoints)}
                  status={point.status}
                  truckData={point}
                  onClick={() => handleTruckClick(point)}
                />
              </AdvancedMarker>
            );
          })}
        </Map>

        {/* Modal */}
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

              {/* Resto del modal - simplificado para debug */}
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