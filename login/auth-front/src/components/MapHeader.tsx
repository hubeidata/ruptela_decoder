import React, { useState, useEffect } from 'react';
import { useGpsContext } from '../context/GpsContext';
import { TruckPoint } from '../types/map.types';
import { panelStyles } from '../styles/mapStyles';
import { getStatusText, formatTimestamp, getStatusFromSpeed } from '../utils/mapUtils';

interface MapHeaderProps {
  onTruckClick?: (truck: TruckPoint) => void;
}

export const MapHeader: React.FC<MapHeaderProps> = ({ onTruckClick }) => {
  const { gpsMap } = useGpsContext();
  const [panelExpanded, setPanelExpanded] = useState<boolean>(false);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [realTimePoints, setRealTimePoints] = useState<TruckPoint[]>([]);

  // Convertir datos GPS del contexto a TruckPoint
  useEffect(() => {
    const points: TruckPoint[] = [];
    
    if (gpsMap.size === 0) {
      setRealTimePoints([]);
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

    setRealTimePoints(points);
  }, [gpsMap]);

  const handleTruckClick = (truck: TruckPoint) => {
    setSelectedTruck(truck.truckId || truck.imei || '');
    if (onTruckClick) {
      onTruckClick(truck);
    }
  };

  return (
    <div style={{
      ...panelStyles.container,
      maxWidth: panelExpanded ? '320px' : '60px',
      width: panelExpanded ? '320px' : '60px'
    }}>
      
      <div style={{
        ...panelStyles.header,
        justifyContent: panelExpanded ? 'space-between' : 'center',
        borderBottom: panelExpanded ? '1px solid #eee' : 'none',
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
        ...panelStyles.content,
        maxHeight: panelExpanded ? '450px' : '0px',
        padding: panelExpanded ? '15px' : '0px'
      }}>
        
        {/* Información en tiempo real */}
        <div style={{
          ...panelStyles.statusInfo,
          backgroundColor: realTimePoints.length > 0 ? '#e8f5e8' : '#fff3e0',
          border: `1px solid ${realTimePoints.length > 0 ? '#4caf50' : '#ff9800'}`
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: realTimePoints.length > 0 ? '#2e7d32' : '#e65100', 
            marginBottom: '8px' 
          }}>
            📡 {realTimePoints.length > 0 ? 'Recibiendo Datos GPS' : 'Esperando Datos GPS'}
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: realTimePoints.length > 0 ? '#2e7d32' : '#e65100' 
          }}>
            Dispositivos activos: {realTimePoints.length}
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: realTimePoints.length > 0 ? '#2e7d32' : '#e65100' 
          }}>
            Estado: {realTimePoints.length > 0 ? 'Conectado' : 'Esperando...'}
          </div>
        </div>
        
        {realTimePoints.length === 0 ? (
          <div style={panelStyles.waitingMessage}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📡</div>
            <div style={{ fontWeight: '600', marginBottom: '5px' }}>
              Esperando datos GPS...
            </div>
            <div style={{ fontSize: '10px', color: '#999' }}>
              Los vehículos aparecerán aquí cuando<br/>
              se reciban los primeros registros GPS
            </div>
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
        
        <div style={panelStyles.legend}>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ color: '#4caf50' }}>●</span> En movimiento (&gt;5 km/h)
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
  );
};