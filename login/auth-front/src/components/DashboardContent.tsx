import React, { useState } from 'react';
import { ReportsButtons } from './ReportsButtons';
import { DashboardStats } from './DashboardStats';
import { MapSection } from './MapSection';
import ReportsModal from './ReportsModal';
import ReportsHistory from './ReportsHistory';

interface DashboardContentProps {
  initialMapConfig: {
    center: { lat: number; lng: number };
    zoom: number;
  };
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ initialMapConfig }) => {
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
    <div className="container my-4 reports-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-gradient">📊 Dashboard Minera Santiago</h1>
        
        <ReportsButtons
          showReportOptions={showReportOptions}
          onGenerateReports={handleGenerateReports}
          onShowHistory={handleShowHistory}
          onReportOptionSelect={handleReportOptionSelect}
        />
      </div>

      <DashboardStats />

      <MapSection
        initialCenter={initialMapConfig.center}
        initialZoom={initialMapConfig.zoom}
      />

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
  );
};