// src/routes/Dashboard.tsx
import React, { useEffect, useState } from "react";
import PortalLayout from "../layout/PortalLayout";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/authConstants";
import { Link, useNavigate } from "react-router-dom";
import GoogleMapStatic from "../components/GoogleMapStatic";
import ReportsModal from "../components/ReportsModal";
import ReportsHistory from "../components/ReportsHistory";
import "../styles/reports.css"; // Importar estilos de reportes

const initialMapConfig = {
  center: { lat: -16.410471, lng: -71.53088 },
  zoom: 15
};

export default function Dashboard() {
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [showReportsHistory, setShowReportsHistory] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'control-origen' | 'ingreso-chute' | null>(null);

  const handleGenerateReports = () => {
    setShowReportOptions(true);
  };

  const handleReportOptionSelect = (reportType: 'control-origen' | 'ingreso-chute') => {
    setSelectedReportType(reportType);
    setShowReportOptions(false);
    setShowReportsModal(true);
  };

  const handleShowHistory = () => {
    setShowReportsHistory(true);
  };

  const closeAllModals = () => {
    setShowReportsModal(false);
    setShowReportOptions(false);
    setShowReportsHistory(false);
    setSelectedReportType(null);
  };

  return (
    <PortalLayout>
      <div className="container my-4 reports-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-gradient">📊 Dashboard Minera Santiago</h1>
          
          {/* Grupo de botones de reportes */}
          <div className="d-flex gap-2">
            {/* Botón Historial de Reportes */}
            <button
              className="btn btn-outline-secondary"
              onClick={handleShowHistory}
              style={{
                borderRadius: '8px',
                padding: '12px 20px',
                fontWeight: '600',
                border: '2px solid #6c757d',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#6c757d';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6c757d';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📋 Historial
            </button>

            {/* Botón Generar Reportes */}
            <div className="dropdown" style={{ position: 'relative' }}>
              <button
                className="reports-button dropdown-toggle"
                type="button"
                onClick={handleGenerateReports}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                📊 Generar Reportes
              </button>
              
              {/* Dropdown de opciones */}
              {showReportOptions && (
                <div 
                  className="dropdown-menu show reports-dropdown fade-in-up"
                  style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 1000,
                    minWidth: '380px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    border: 'none',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.95)'
                  }}
                >
                  <button
                    className="dropdown-item"
                    onClick={() => handleReportOptionSelect('control-origen')}
                    style={{ 
                      padding: '16px 20px',
                      fontSize: '14px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    <div className="text-start">
                      <strong>📋 Registro de control de origen de material y transporte</strong>
                      <div className="text-muted small mt-1">
                        Control de extracción y movimiento de material - Operación y planta de procesamiento
                      </div>
                    </div>
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => handleReportOptionSelect('ingreso-chute')}
                    style={{ 
                      padding: '16px 20px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    <div className="text-start">
                      <strong>🚛 Registro de ingreso de material al chute</strong>
                      <div className="text-muted small mt-1">
                        Proceso gravimétrico y cosecha de pre-concentrado - Vaciado de volquetes
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarjetas de información rápida */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <h3 className="card-title text-primary">📍</h3>
                <h6 className="card-subtitle mb-2 text-muted">GPS Activos</h6>
                <p className="card-text">Monitoreo en tiempo real</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <h3 className="card-title text-success">🚛</h3>
                <h6 className="card-subtitle mb-2 text-muted">Volquetes</h6>
                <p className="card-text">Flota operativa</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <h3 className="card-title text-warning">⛏️</h3>
                <h6 className="card-subtitle mb-2 text-muted">Excavadoras</h6>
                <p className="card-text">Equipos de extracción</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <h3 className="card-title text-info">📊</h3>
                <h6 className="card-subtitle mb-2 text-muted">Reportes</h6>
                <p className="card-text">Documentación diaria</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mt-4 mb-3">🗺️ Mapa de Eventos GPS</h2>
        <div 
          className="shadow-reports"
          style={{ 
            position: "relative", 
            width: "100%", 
            height: "500px",
            borderRadius: "12px",
            overflow: "hidden"
          }}
        >
          <GoogleMapStatic 
            initialCenter={initialMapConfig.center} 
            initialZoom={initialMapConfig.zoom} 
          />
        </div>

        {/* Información adicional */}
        <div className="row mt-4">
          <div className="col-md-8">
            <div className="card border-gradient">
              <div className="card-header bg-light">
                <h6 className="mb-0">ℹ️ Información del Sistema</h6>
              </div>
              <div className="card-body">
                <p className="mb-2">
                  <strong>Sistema de Tracking GPS:</strong> Monitoreo en tiempo real de vehículos y equipos mineros
                </p>
                <p className="mb-2">
                  <strong>Protocolo:</strong> Ruptela con validación CRC-16 y filtrado automático de datos
                </p>
                <p className="mb-0">
                  <strong>Integración:</strong> Sistema de cámaras Artemis y generación automática de reportes
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-gradient">
              <div className="card-header bg-light">
                <h6 className="mb-0">⚡ Estado del Sistema</h6>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>TCP Server:</span>
                  <span className="badge bg-success">🟢 Activo</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>WebSocket:</span>
                  <span className="badge bg-success">🟢 Conectado</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Base de Datos:</span>
                  <span className="badge bg-success">🟢 Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Reportes */}
        {showReportsModal && selectedReportType && (
          <div className="reports-modal">
            <ReportsModal
              reportType={selectedReportType}
              onClose={closeAllModals}
            />
          </div>
        )}

        {/* Modal de Historial */}
        {showReportsHistory && (
          <div className="reports-history">
            <ReportsHistory
              onClose={closeAllModals}
            />
          </div>
        )}

        {/* Overlay para cerrar dropdown */}
        {showReportOptions && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setShowReportOptions(false)}
          />
        )}
      </div>
    </PortalLayout>
  );
}