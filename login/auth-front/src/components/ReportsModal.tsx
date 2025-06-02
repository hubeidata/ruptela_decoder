
import React, { useState, useEffect } from 'react';
import { generateControlOrigenPDF, generateIngresoCrutePDF } from '../utils/pdfGenerator';
import { API_URL } from '../auth/authConstants';

interface ReportsModalProps {
  onClose: () => void;
  reportType?: 'control-origen' | 'ingreso-chute';
}

interface Personnel {
  id: string;
  name: string;
  role: string;
}

interface Equipment {
  id: string;
  code: string;
  plate: string;
  type: 'excavadora' | 'volquete';
}

interface FormData {
  fecha: string;
  hora: string;
  turno: 'Mañana' | 'Tarde' | 'Relevado';
  responsable: string;
  controlador: string;
  excavadora: string;
  volquetes: string[];
}

const ReportsModal: React.FC<ReportsModalProps> = ({ onClose, reportType = 'control-origen' }) => {
  const [currentReportType, setCurrentReportType] = useState<'control-origen' | 'ingreso-chute'>(reportType);
  const [showReportSelection, setShowReportSelection] = useState(!reportType);
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    turno: 'Mañana',
    responsable: '',
    controlador: '',
    excavadora: '',
    volquetes: []
  });

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [excavadoras, setExcavadoras] = useState<Equipment[]>([]);
  const [volquetes, setVolquetes] = useState<Equipment[]>([]);
  const [availableVolquetes, setAvailableVolquetes] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-completar turno basado en la hora
  useEffect(() => {
    const hour = parseInt(formData.hora.split(':')[0]);
    let turno: 'Mañana' | 'Tarde' | 'Relevado';
    
    if (hour >= 6 && hour < 14) {
      turno = 'Mañana';
    } else if (hour >= 14 && hour < 22) {
      turno = 'Tarde';
    } else {
      turno = 'Relevado';
    }
    
    setFormData(prev => ({ ...prev, turno }));
  }, [formData.hora]);

  // Cargar datos desde la base de datos
  useEffect(() => {
    loadData();
  }, []);

  // Cargar volquetes disponibles cuando se selecciona excavadora
  useEffect(() => {
    if (formData.excavadora) {
      loadAvailableVolquetes(formData.excavadora);
    }
  }, [formData.excavadora]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Simular llamadas a la API - RUTAS ACTUALIZADAS
      const [personnelRes, equipmentRes] = await Promise.all([
        fetch(`${API_URL}/api/reports/personnel`),
        fetch(`${API_URL}/api/reports/equipment`)
      ]);

      // Si las APIs no existen, usar datos de ejemplo
      if (!personnelRes.ok || !equipmentRes.ok) {
        // Datos de ejemplo - REEMPLAZAR CON DATOS REALES
        setPersonnel([
          { id: '1', name: 'Juan Pérez', role: 'Operador' },
          { id: '2', name: 'María García', role: 'Controlador' },
          { id: '3', name: 'Carlos López', role: 'Supervisor' },
          { id: '4', name: 'Ana Rodríguez', role: 'Operador' }
        ]);

        setExcavadoras([
          { id: '1', code: 'EXC-001', plate: 'ABC-123', type: 'excavadora' },
          { id: '2', code: 'EXC-002', plate: 'DEF-456', type: 'excavadora' },
          { id: '3', code: 'EXC-003', plate: 'GHI-789', type: 'excavadora' }
        ]);

        setVolquetes([
          { id: '1', code: 'VOL-001', plate: 'VOL-123', type: 'volquete' },
          { id: '2', code: 'VOL-002', plate: 'VOL-456', type: 'volquete' },
          { id: '3', code: 'VOL-003', plate: 'VOL-789', type: 'volquete' },
          { id: '4', code: 'VOL-004', plate: 'VOL-101', type: 'volquete' },
          { id: '5', code: 'VOL-005', plate: 'VOL-202', type: 'volquete' }
        ]);
      } else {
        const personnelData = await personnelRes.json();
        const equipmentData = await equipmentRes.json();
        
        setPersonnel(personnelData.data || []);
        
        // La API de equipment ahora devuelve un objeto con arrays separados
        if (equipmentData.data && equipmentData.data.excavadoras) {
          setExcavadoras(equipmentData.data.excavadoras);
          setVolquetes(equipmentData.data.volquetes);
        } else {
          // Fallback para compatibilidad con API antigua
          setExcavadoras(equipmentData.data.filter((eq: Equipment) => eq.type === 'excavadora') || []);
          setVolquetes(equipmentData.data.filter((eq: Equipment) => eq.type === 'volquete') || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Usar datos de ejemplo en caso de error
      setPersonnel([
        { id: '1', name: 'Juan Pérez', role: 'Operador' },
        { id: '2', name: 'María García', role: 'Controlador' },
        { id: '3', name: 'Carlos López', role: 'Supervisor' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableVolquetes = async (excavadoraId: string) => {
    try {
      // Cargar volquetes asociados a la excavadora - RUTA ACTUALIZADA
      const response = await fetch(`${API_URL}/api/reports/equipment/volquetes-by-excavadora/${excavadoraId}`);
      
      if (!response.ok) {
        // Filtrar volquetes disponibles (simulación)
        const available = volquetes.filter(vol => 
          parseInt(vol.id) <= parseInt(excavadoraId) + 2
        );
        setAvailableVolquetes(available);
      } else {
        const data = await response.json();
        setAvailableVolquetes(data.data || []);
      }
    } catch (error) {
      console.error('Error loading volquetes:', error);
      setAvailableVolquetes(volquetes.slice(0, 3)); // Fallback
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVolqueteToggle = (volqueteId: string) => {
    setFormData(prev => ({
      ...prev,
      volquetes: prev.volquetes.includes(volqueteId)
        ? prev.volquetes.filter(id => id !== volqueteId)
        : [...prev.volquetes, volqueteId]
    }));
  };

  const handleExportReport = async () => {
    if (!formData.responsable || !formData.controlador || !formData.excavadora) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      
      // Obtener datos completos para el PDF
      const responsableData = personnel.find(p => p.id === formData.responsable);
      const controladorData = personnel.find(p => p.id === formData.controlador);
      const excavadoraData = excavadoras.find(e => e.id === formData.excavadora);
      const volquetesData = availableVolquetes.filter(v => formData.volquetes.includes(v.id));

      const reportData = {
        ...formData,
        responsableNombre: responsableData?.name || '',
        controladorNombre: controladorData?.name || '',
        excavadoraInfo: excavadoraData || null,
        volquetesInfo: volquetesData
      };

      // Generar PDF según el tipo de reporte
      if (currentReportType === 'control-origen') {
        await generateControlOrigenPDF(reportData);
      } else {
        await generateIngresoCrutePDF(reportData);
      }

      // Opcional: Guardar el reporte en la base de datos
      const saveReportToDatabase = async (reportData: any, reportType: string) => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const response = await fetch(`${API_URL}/api/reports/save-report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': token })
            },
            body: JSON.stringify({
              reportType,
              reportData,
              fechaReporte: reportData.fecha,
              turno: reportData.turno,
              metadata: {
                excavadora_id: reportData.excavadora,
                volquetes_count: reportData.volquetes.length,
                generated_at: new Date().toISOString()
              }
            })
          });
          
          if (response.ok) {
            console.log('Reporte guardado en la base de datos');
          }
        } catch (error) {
          console.error('Error saving report to database:', error);
        }
      };
      
      await saveReportToDatabase(reportData, currentReportType);
      
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (showReportSelection) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Seleccionar Tipo de Reporte</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="d-grid gap-3">
                <button
                  className="btn btn-outline-primary p-3"
                  onClick={() => {
                    setCurrentReportType('control-origen');
                    setShowReportSelection(false);
                  }}
                >
                  <div className="text-start">
                    <strong>📋 Registro de control de origen de material y transporte</strong>
                    <div className="text-muted small mt-1">
                      Control de extracción y movimiento de material
                    </div>
                  </div>
                </button>
                <button
                  className="btn btn-outline-primary p-3"
                  onClick={() => {
                    setCurrentReportType('ingreso-chute');
                    setShowReportSelection(false);
                  }}
                >
                  <div className="text-start">
                    <strong>🚛 Registro de ingreso de material al chute</strong>
                    <div className="text-muted small mt-1">
                      Proceso gravimétrico y cosecha de pre-concentrado
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {currentReportType === 'control-origen' 
                ? '📋 Registro de Control de Origen' 
                : '🚛 Registro de Ingreso al Chute'
              }
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {loading && (
              <div className="text-center mb-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            )}

            <form>
              {/* Fecha y Hora */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Fecha *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Hora *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.hora}
                    onChange={(e) => handleInputChange('hora', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Turno</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.turno}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>

              {/* Personal */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Responsable *</label>
                  <select
                    className="form-select"
                    value={formData.responsable}
                    onChange={(e) => handleInputChange('responsable', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar responsable...</option>
                    {personnel.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name} - {person.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Controlador *</label>
                  <select
                    className="form-select"
                    value={formData.controlador}
                    onChange={(e) => handleInputChange('controlador', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar controlador...</option>
                    {personnel.map(person => (
                      <option key={person.id} value={person.id}>
                        {person.name} - {person.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excavadora */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Excavadora *</label>
                  <select
                    className="form-select"
                    value={formData.excavadora}
                    onChange={(e) => handleInputChange('excavadora', e.target.value)}
                    required
                  >
                    <option value="">Seleccionar excavadora...</option>
                    {excavadoras.map(exc => (
                      <option key={exc.id} value={exc.id}>
                        {exc.code} - {exc.plate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Volquetes */}
              {formData.excavadora && availableVolquetes.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Volquetes Asociados</label>
                  <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {availableVolquetes.map(vol => (
                      <div key={vol.id} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`volquete-${vol.id}`}
                          checked={formData.volquetes.includes(vol.id)}
                          onChange={() => handleVolqueteToggle(vol.id)}
                        />
                        <label className="form-check-label" htmlFor={`volquete-${vol.id}`}>
                          {vol.code} - {vol.plate}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowReportSelection(true)}
            >
              ← Cambiar Tipo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportReport}
              disabled={loading || !formData.responsable || !formData.controlador || !formData.excavadora}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Generando...
                </>
              ) : (
                <>📄 Exportar Reporte</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;