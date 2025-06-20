import React from 'react';

export const DashboardStats: React.FC = () => {
  return (
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
  );
};