import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import PortalLayout from "../layout/PortalLayout";
import { API_URL } from "../auth/authConstants"; // ← Importa la constante

const API = `${API_URL}/api`; // ← Usa la misma base que RegistrationForm

export default function Recursos() {
  // --- Personal ---
  const [personal, setPersonal] = useState([]);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(null);
  const [personalForm, setPersonalForm] = useState({ nombre: "", dni: "", telefono_familia: "" });

  // --- Maquinaria ---
  const [maquinaria, setMaquinaria] = useState([]);
  const [showMaquinariaModal, setShowMaquinariaModal] = useState(false);
  const [editingMaquinaria, setEditingMaquinaria] = useState(null);
  const [maquinariaForm, setMaquinariaForm] = useState({ nombre_maquinaria: "", imei: "", telefono: "" });

  // --- Horario ---
  const [horarios, setHorarios] = useState([]);
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [horarioForm, setHorarioForm] = useState({
    id_persona: "",
    id_maquinaria: "",
    fecha_inicio: "",
    fecha_final: "",
    usuario_asigno: ""
  });

  // --- Cargar datos ---
  useEffect(() => {
    fetch(`${API}/personal`)
      .then(r => r.json())
      .then(data => setPersonal(Array.isArray(data) ? data : []));
    fetch(`${API}/maquinaria`)
      .then(r => r.json())
      .then(data => setMaquinaria(Array.isArray(data) ? data : []));
    fetch(`${API}/horario`)
      .then(r => r.json())
      .then(data => setHorarios(Array.isArray(data) ? data : []));
  }, []);

  // --- CRUD Personal ---
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    if (editingPersonal) {
      await fetch(`${API}/personal/${editingPersonal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalForm)
      });
    } else {
      await fetch(`${API}/personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalForm)
      });
    }
    fetch(`${API}/personal`).then(r => r.json()).then(setPersonal);
    setShowPersonalModal(false);
    setEditingPersonal(null);
    setPersonalForm({ nombre: "", dni: "", telefono_familia: "" });
  };

  const handleEditPersonal = (p) => {
    setEditingPersonal(p);
    setPersonalForm({ nombre: p.nombre, dni: p.dni, telefono_familia: p.telefono_familia });
    setShowPersonalModal(true);
  };

  const handleDeletePersonal = async (id) => {
    if (window.confirm("¿Eliminar este registro?")) {
      await fetch(`${API}/personal/${id}`, { method: "DELETE" });
      fetch(`${API}/personal`).then(r => r.json()).then(setPersonal);
    }
  };

  // --- CRUD Maquinaria ---
  const handleMaquinariaSubmit = async (e) => {
    e.preventDefault();
    if (editingMaquinaria) {
      await fetch(`${API}/maquinaria/${editingMaquinaria.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maquinariaForm)
      });
    } else {
      await fetch(`${API}/maquinaria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maquinariaForm)
      });
    }
    fetch(`${API}/maquinaria`).then(r => r.json()).then(setMaquinaria);
    setShowMaquinariaModal(false);
    setEditingMaquinaria(null);
    setMaquinariaForm({ nombre_maquinaria: "", imei: "", telefono: "" });
  };

  const handleEditMaquinaria = (m) => {
    setEditingMaquinaria(m);
    setMaquinariaForm({ nombre_maquinaria: m.nombre_maquinaria, imei: m.imei, telefono: m.telefono });
    setShowMaquinariaModal(true);
  };

  const handleDeleteMaquinaria = async (id) => {
    if (window.confirm("¿Eliminar este registro?")) {
      await fetch(`${API}/maquinaria/${id}`, { method: "DELETE" });
      fetch(`${API}/maquinaria`).then(r => r.json()).then(setMaquinaria);
    }
  };

  // --- CRUD Horario ---
  const handleHorarioSubmit = async (e) => {
    e.preventDefault();
    if (editingHorario) {
      await fetch(`${API}/horario/${editingHorario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horarioForm)
      });
    } else {
      await fetch(`${API}/horario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(horarioForm)
      });
    }
    fetch(`${API}/horario`).then(r => r.json()).then(setHorarios);
    setShowHorarioModal(false);
    setEditingHorario(null);
    setHorarioForm({
      id_persona: "",
      id_maquinaria: "",
      fecha_inicio: "",
      fecha_final: "",
      usuario_asigno: ""
    });
  };

  const handleEditHorario = (h) => {
    setEditingHorario(h);
    setHorarioForm({
      id_persona: h.id_persona,
      id_maquinaria: h.id_maquinaria,
      fecha_inicio: h.fecha_inicio?.slice(0, 16),
      fecha_final: h.fecha_final?.slice(0, 16),
      usuario_asigno: h.usuario_asigno
    });
    setShowHorarioModal(true);
  };

  const handleDeleteHorario = async (id) => {
    if (window.confirm("¿Eliminar este registro?")) {
      await fetch(`${API}/horario/${id}`, { method: "DELETE" });
      fetch(`${API}/horario`).then(r => r.json()).then(setHorarios);
    }
  };

  // --- Render ---
  return (
    <PortalLayout>
      <div className="container my-4">
        <h1 className="mb-4">Recursos Humanos y Equipos</h1>

        {/* --- Personal --- */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4>Personal</h4>
            <Button onClick={() => { setEditingPersonal(null); setShowPersonalModal(true); }}>Añadir</Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Teléfono Familia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personal.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">No hay registros de personal.</td>
                </tr>
              ) : (
                personal.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.dni}</td>
                    <td>{p.telefono_familia}</td>
                    <td>
                      <Button size="sm" variant="warning" onClick={() => handleEditPersonal(p)}>Editar</Button>{" "}
                      <Button size="sm" variant="danger" onClick={() => handleDeletePersonal(p.id)}>Eliminar</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </section>

        {/* --- Maquinaria --- */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4>Maquinaria</h4>
            <Button onClick={() => { setEditingMaquinaria(null); setShowMaquinariaModal(true); }}>Añadir</Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nombre Maquinaria</th>
                <th>IMEI</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {maquinaria.map((m) => (
                <tr key={m.id}>
                  <td>{m.nombre_maquinaria}</td>
                  <td>{m.imei}</td>
                  <td>{m.telefono}</td>
                  <td>
                    <Button size="sm" variant="warning" onClick={() => handleEditMaquinaria(m)}>Editar</Button>{" "}
                    <Button size="sm" variant="danger" onClick={() => handleDeleteMaquinaria(m.id)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        {/* --- Horario --- */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4>Asignación de Horarios</h4>
            <Button onClick={() => { setEditingHorario(null); setShowHorarioModal(true); }}>Añadir</Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Personal</th>
                <th>Maquinaria</th>
                <th>Fecha Inicio</th>
                <th>Fecha Final</th>
                <th>Usuario Asignó</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map((h) => (
                <tr key={h.id}>
                  <td>{personal.find(p => p.id === h.id_persona)?.nombre || h.id_persona}</td>
                  <td>{maquinaria.find(m => m.id === h.id_maquinaria)?.nombre_maquinaria || h.id_maquinaria}</td>
                  <td>{h.fecha_inicio?.replace("T", " ").slice(0, 16)}</td>
                  <td>{h.fecha_final?.replace("T", " ").slice(0, 16)}</td>
                  <td>{h.usuario_asigno}</td>
                  <td>
                    <Button size="sm" variant="warning" onClick={() => handleEditHorario(h)}>Editar</Button>{" "}
                    <Button size="sm" variant="danger" onClick={() => handleDeleteHorario(h.id)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        {/* --- Modals --- */}
        <Modal show={showPersonalModal} onHide={() => setShowPersonalModal(false)}>
          <Form onSubmit={handlePersonalSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{editingPersonal ? "Editar Personal" : "Añadir Personal"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Nombre</Form.Label>
                <Form.Control required value={personalForm.nombre} onChange={e => setPersonalForm(f => ({ ...f, nombre: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>DNI</Form.Label>
                <Form.Control required value={personalForm.dni} onChange={e => setPersonalForm(f => ({ ...f, dni: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Teléfono Familia</Form.Label>
                <Form.Control value={personalForm.telefono_familia} onChange={e => setPersonalForm(f => ({ ...f, telefono_familia: e.target.value }))} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPersonalModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showMaquinariaModal} onHide={() => setShowMaquinariaModal(false)}>
          <Form onSubmit={handleMaquinariaSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{editingMaquinaria ? "Editar Maquinaria" : "Añadir Maquinaria"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Nombre Maquinaria</Form.Label>
                <Form.Control required value={maquinariaForm.nombre_maquinaria} onChange={e => setMaquinariaForm(f => ({ ...f, nombre_maquinaria: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>IMEI</Form.Label>
                <Form.Control required value={maquinariaForm.imei} onChange={e => setMaquinariaForm(f => ({ ...f, imei: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control value={maquinariaForm.telefono} onChange={e => setMaquinariaForm(f => ({ ...f, telefono: e.target.value }))} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowMaquinariaModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <Modal show={showHorarioModal} onHide={() => setShowHorarioModal(false)}>
          <Form onSubmit={handleHorarioSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{editingHorario ? "Editar Horario" : "Asignar Horario"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Personal</Form.Label>
                <Form.Select required value={horarioForm.id_persona} onChange={e => setHorarioForm(f => ({ ...f, id_persona: e.target.value }))}>
                  <option value="">Seleccione...</option>
                  {personal.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Maquinaria</Form.Label>
                <Form.Select required value={horarioForm.id_maquinaria} onChange={e => setHorarioForm(f => ({ ...f, id_maquinaria: e.target.value }))}>
                  <option value="">Seleccione...</option>
                  {maquinaria.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre_maquinaria}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Fecha Inicio</Form.Label>
                <Form.Control type="datetime-local" required value={horarioForm.fecha_inicio} onChange={e => setHorarioForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Fecha Final</Form.Label>
                <Form.Control type="datetime-local" required value={horarioForm.fecha_final} onChange={e => setHorarioForm(f => ({ ...f, fecha_final: e.target.value }))} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Usuario Asignó</Form.Label>
                <Form.Control required value={horarioForm.usuario_asigno} onChange={e => setHorarioForm(f => ({ ...f, usuario_asigno: e.target.value }))} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowHorarioModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary">Guardar</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </PortalLayout>
  );
}