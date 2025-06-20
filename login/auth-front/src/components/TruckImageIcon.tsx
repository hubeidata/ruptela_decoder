import React from 'react';
import { TruckPoint } from '../types/map.types';
import { truckIconStyles, getStatusColors } from '../styles/mapStyles';

interface TruckImageIconProps {
  rotation?: number;
  status?: 'active' | 'loading' | 'idle';
  truckData?: TruckPoint;
  onClick?: () => void;
}

export const TruckImageIcon: React.FC<TruckImageIconProps> = ({ 
  rotation = 0, 
  status = 'idle',
  truckData,
  onClick 
}) => {
  const colors = getStatusColors(status);
  const isActive = status !== 'idle';
  
  return (
    <div style={truckIconStyles.container} onClick={onClick}>
      {isActive && (
        <div
          style={{
            ...truckIconStyles.pulseAnimation,
            backgroundColor: colors.pulse,
          }}
        />
      )}
      
      <div
        style={{
          ...truckIconStyles.mainCircle,
          border: `3px solid ${colors.border}`,
          boxShadow: `0 0 15px ${colors.shadow}`,
        }}
      >
        <img
          src="/volquete_sin_fondo.png"
          alt="Volquete minero"
          style={{
            ...truckIconStyles.truckImage,
            transform: `rotate(${rotation - 90}deg)`,
          }}
        />
      </div>
      
      <div
        style={{
          ...truckIconStyles.statusBadge,
          backgroundColor: colors.border,
        }}
      >
        {status === 'loading' && '↓'}
        {status === 'active' && '→'}
        {status === 'idle' && '⏸'}
      </div>
      
      <div
        style={{
          ...truckIconStyles.tooltip,
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