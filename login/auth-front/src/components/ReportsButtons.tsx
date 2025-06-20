import React from 'react';

interface ReportsButtonsProps {
  showReportOptions: boolean;
  onGenerateReports: () => void;
  onShowHistory: () => void;
  onReportOptionSelect: (reportType: 'control-origen' | 'ingreso-chute') => void;
}

export const ReportsButtons: React.FC<ReportsButtonsProps> = ({
  showReportOptions,
  onGenerateReports,
  onShowHistory,
  onReportOptionSelect
}) => {
  return (
    <div className="d-flex gap-2">
      {/* Botón Historial de Reportes */}
      <button
        className="btn btn-outline-secondary"
        onClick={onShowHistory}
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
          onClick={onGenerateReports}
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
              onClick={() => onReportOptionSelect('control-origen')}
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
              onClick={() => onReportOptionSelect('ingreso-chute')}
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
  );
};