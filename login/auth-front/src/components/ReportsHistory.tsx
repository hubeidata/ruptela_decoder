
import React, { useState, useEffect } from 'react';
import { API_URL } from '../auth/authConstants';

interface ReportRecord {
  id: number;
  report_type: string;
  fecha_reporte: string;
  turno: string;
  responsable: string;
  controlador: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ReportsHistoryProps {
  onClose: () => void;
}

const ReportsHistory: React.FC<ReportsHistoryProps> = ({ onClose }) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const [filters, setFilters] = useState({
    reportType: '',
    dateFrom: '',
    dateTo: '',
    turno: ''
  });

  const [stats, setStats] = useState({
    total_reportes: 0,
    dias_con_reportes: 0,
    usuarios_activos: 0
  });

  useEffect(() => {
    loadReports();
    loadStats();
  }, [pagination.page, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.reportType && { reportType: filters.reportType }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.turno && { turno: filters.turno })
      });

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/reports/history?${searchParams}`, {
        headers: {
          ...(token && { 'Authorization': token })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error loading reports history');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/reports/stats`, {
        headers: {
          ...(token && { 'Authorization': token })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.summary);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatReportType = (type: string) => {
    switch (type) {
      case 'control-origen':
        return 'Control de Origen';
      case 'ingreso-chute':
        return 'Ingreso al Chute';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">📊 Historial de Reportes Generados</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {/* Estadísticas rápidas */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card text-center border-primary">
                  <div className="card-body">
                    <h5 className="card-title text-primary">{stats.total_reportes}</h5>
                    <p className="card-text">Reportes Totales</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center border-success">
                  <div className="card-body">
                    <h5 className="card-title text-success">{stats.dias_con_reportes}</h5>
                    <p className="card-text">Días con Reportes</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center border-info">
                  <div className="card-body">
                    <h5 className="card-title text-info">{stats.usuarios_activos}</h5>
                    <p className="card-text">Usuarios Activos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">🔍 Filtros de Búsqueda</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Tipo de Reporte</label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.reportType}
                      onChange={(e) => handleFilterChange('reportType', e.target.value)}
                    >
                      <option value="">Todos los tipos</option>
                      <option value="control-origen">Control de Origen</option>
                      <option value="ingreso-chute">Ingreso al Chute</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Fecha Desde</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Fecha Hasta</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Turno</label>
                    <select
                      className="form-select form-select-sm"
                      value={filters.turno}
                      onChange={(e) => handleFilterChange('turno', e.target.value)}
                    >
                      <option value="">Todos los turnos</option>
                      <option value="Mañana">Mañana</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Relevado">Relevado</option>
                    </select>
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-12">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setFilters({ reportType: '', dateFrom: '', dateTo: '', turno: '' });
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                    >
                      🗑️ Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de reportes */}
            <div className="table-responsive">
              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando historial...</p>
                </div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Tipo de Reporte</th>
                      <th>Fecha del Reporte</th>
                      <th>Turno</th>
                      <th>Responsable</th>
                      <th>Controlador</th>
                      <th>Generado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <div className="text-muted">
                            <i className="fa fa-inbox fa-2x mb-2"></i>
                            <p>No se encontraron reportes con los filtros aplicados</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <span className="badge bg-primary">#{report.id}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              report.report_type === 'control-origen' 
                                ? 'bg-success' 
                                : 'bg-info'
                            }`}>
                              {formatReportType(report.report_type)}
                            </span>
                          </td>
                          <td>{formatDate(report.fecha_reporte)}</td>
                          <td>
                            <span className={`badge ${
                              report.turno === 'Mañana' ? 'bg-warning' :
                              report.turno === 'Tarde' ? 'bg-primary' : 'bg-dark'
                            } text-${report.turno === 'Mañana' ? 'dark' : 'white'}`}>
                              {report.turno}
                            </span>
                          </td>
                          <td>{report.responsable || 'N/A'}</td>
                          <td>{report.controlador || 'N/A'}</td>
                          <td>
                            <small className="text-muted">
                              {formatDateTime(report.created_at)}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                title="Ver detalles"
                                onClick={() => {
                                  // Implementar vista de detalles
                                  console.log('Ver detalles del reporte:', report.id);
                                }}
                              >
                                👁️
                              </button>
                              <button
                                className="btn btn-outline-success btn-sm"
                                title="Regenerar PDF"
                                onClick={() => {
                                  // Implementar regeneración de PDF
                                  console.log('Regenerar PDF:', report.id);
                                }}
                              >
                                📄
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <nav className="mt-4">
                <ul className="pagination pagination-sm justify-content-center">
                  <li className={`page-item ${!pagination.hasPrev ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Anterior
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum <= pagination.totalPages) {
                      return (
                        <li
                          key={pageNum}
                          className={`page-item ${pageNum === pagination.page ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    }
                    return null;
                  })}
                  
                  <li className={`page-item ${!pagination.hasNext ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
                
                <div className="text-center text-muted small">
                  Página {pagination.page} de {pagination.totalPages} 
                  ({pagination.total} reportes en total)
                </div>
              </nav>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // Implementar exportación de historial completo
                console.log('Exportar historial completo');
              }}
            >
              📊 Exportar Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsHistory;