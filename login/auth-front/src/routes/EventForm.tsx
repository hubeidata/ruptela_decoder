// src/routes/EventForm.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/authConstants";
import { useNavigate, useParams } from "react-router-dom";
import PortalLayout from "../layout/PortalLayout";
import { googleFonts, loadGoogleFont } from "../utils/googleFonts";
import "bootstrap/dist/css/bootstrap.min.css";

type RegistrationField = {
  fieldName: string;
  fieldType: "text" | "number" | "email" | "date";
  required: boolean;
};

interface EventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationFields: RegistrationField[]; // Solo campos adicionales
  keyVisual?: string;      // Imagen Key Visual (data URL)
  primaryColor?: string;   // Fondo de invitación
  secondaryColor?: string; // Color de texto de invitación
  fontFamily?: string;     // Fuente seleccionada
}

const mandatoryFields = [
  { fieldName: "Nombre", fieldType: "text", required: true },
  { fieldName: "Teléfono", fieldType: "number", required: true },
  { fieldName: "Correo", fieldType: "email", required: true },
  { fieldName: "Documento", fieldType: "text", required: true },
];

export default function EventForm() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [eventData, setEventData] = useState<EventData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationFields: [], // Campos adicionales editables
    fontFamily: "Roboto",
  });
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    loadGoogleFont(eventData.fontFamily || "Roboto");
  }, [eventData.fontFamily]);

  useEffect(() => {
    if (id) {
      console.log("Cargando datos para edición del evento con ID:", id);
      fetch(`${API_URL}/api/events/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.getAccessToken()}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Datos del evento cargados:", data);
          loadGoogleFont(data.body.branding?.fontFamily || "Roboto");
          setEventData({
            title: data.body.title,
            description: data.body.description,
            startDate: new Date(data.body.startDate).toISOString().slice(0, 16),
            endDate: new Date(data.body.endDate).toISOString().slice(0, 16),
            registrationFields: data.body.registrationFields || [],
            keyVisual: data.body.branding?.keyVisual,
            primaryColor: data.body.branding?.primaryColor,
            secondaryColor: data.body.branding?.secondaryColor,
            fontFamily: data.body.branding?.fontFamily || "Roboto",
          });
        })
        .catch((err) => console.error("Error cargando evento:", err));
    }
  }, [id, auth]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEventData({
      ...eventData,
      [e.target.name]: e.target.value,
    });
  }

  function handleFontFamilyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newFont = e.target.value;
    loadGoogleFont(newFont);
    setEventData({ ...eventData, fontFamily: newFont });
  }

  function handleKeyVisualChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setEventData({ ...eventData, keyVisual: reader.result as string });
        console.log("Key Visual cargada");
      };
      reader.readAsDataURL(file);
    }
  }

  // Manejo de campos adicionales
  function handleFieldChange(index: number, field: Partial<RegistrationField>) {
    const updated = [...eventData.registrationFields];
    updated[index] = { ...updated[index], ...field };
    setEventData({ ...eventData, registrationFields: updated });
  }

  function addField() {
    setEventData({
      ...eventData,
      registrationFields: [
        ...eventData.registrationFields,
        { fieldName: "", fieldType: "text", required: false },
      ],
    });
    console.log("Campo adicional agregado");
  }

  function removeField(index: number) {
    const updated = eventData.registrationFields.filter((_, i) => i !== index);
    setEventData({ ...eventData, registrationFields: updated });
    console.log("Campo adicional eliminado, índice:", index);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("handleSubmit triggered", eventData);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `${API_URL}/api/events/${id}` : `${API_URL}/api/events`;
      // Construir el payload con la estructura correcta
      const eventPayload = {
        title: eventData.title,
        description: eventData.description,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        registrationFields: eventData.registrationFields,
        branding: {
          keyVisual: eventData.keyVisual,
          primaryColor: eventData.primaryColor,
          secondaryColor: eventData.secondaryColor,
          fontFamily: eventData.fontFamily,
        },
      };
      console.log("Enviando payload:", eventPayload);
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.getAccessToken()}`,
        },
        body: JSON.stringify(eventPayload),
      });
      console.log("Respuesta del servidor:", response);
      if (response.ok) {
        const data = await response.json();
        console.log("Datos recibidos:", data);
        setSuccessMessage(data.body.message);
      } else {
        console.error("Error al crear o actualizar el evento", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
    }
  }
  // Previsualización: muestra bloque de invitación con todos los datos
  const renderFormPreview = () => {
    const renderMandatory = mandatoryFields.map((field, idx) => (
      <div className="mb-3" key={`m-${idx}`}>
        <label className="form-label">
          {field.fieldName} <span className="text-danger">*</span>
        </label>
        <input
          type={field.fieldType}
          className="form-control"
          disabled
          placeholder={field.fieldName}
        />
      </div>
    ));

    const renderAdditional = eventData.registrationFields.map((field, idx) => (
      <div className="mb-3" key={`a-${idx}`}>
        <label className="form-label">
          {field.fieldName || "Campo sin nombre"}
          {field.required && <span className="text-danger ms-1">*</span>}
        </label>
        <input
          type={field.fieldType}
          className="form-control"
          disabled
          placeholder={field.fieldName}
        />
      </div>
    ));

    return (
      <div>
        {eventData.keyVisual && (
          <div className="mb-3">
            <img src={eventData.keyVisual} alt="Key Visual" className="img-fluid rounded" />
          </div>
        )}
        <div
          style={{
            backgroundColor: eventData.primaryColor || "#311676",
            color: eventData.secondaryColor || "#ffffff",
            padding: "20px",
            textAlign: "center",
            marginBottom: "20px",
            textTransform: "uppercase",
            fontWeight: "bold",
            letterSpacing: "1px",
            fontFamily: eventData.fontFamily,
          }}
        >
          <h1 style={{ fontSize: "2rem", margin: 0 }}>
            {eventData.title || "NOMBRE DEL EVENTO"}
          </h1>
          <p style={{ fontSize: "1.2rem", margin: "5px 0" }}>
            {eventData.description || "DESCRIPCIÓN DEL EVENTO"}
          </p>
          <p style={{ fontSize: "1.2rem", margin: 0 }}>
            {eventData.startDate
              ? new Date(eventData.startDate).toLocaleString()
              : "FECHA/HORA INICIO"}{" "}
            -{" "}
            {eventData.endDate
              ? new Date(eventData.endDate).toLocaleString()
              : "FECHA/HORA FIN"}
          </p>
        </div>
        <form>
          {renderMandatory}
          {renderAdditional}
        </form>
        <div className="text-center mt-4">
          <button type="button" className="btn btn-success">
            Registrarse
          </button>
        </div>
      </div>
    );
  };

  if (successMessage) {
    console.log("Evento creado con éxito:", successMessage);
    return (
      <PortalLayout>
        <div className="container my-4">
          <div className="alert alert-success text-center">
            <h2>{successMessage}</h2>
            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate("/dashboard")}
            >
              Cerrar
            </button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="container my-4">
        <h1 className="mb-4">{id ? "Editar Evento" : "Crear Nuevo Evento"}</h1>
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Columna Izquierda: Edición */}
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Nombre del Evento</label>
                <input
                  type="text"
                  name="title"
                  value={eventData.title}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  name="description"
                  value={eventData.description}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="row">
                <div className="mb-3 col-md-6">
                  <label className="form-label">Fecha y Hora de Inicio</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={eventData.startDate}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3 col-md-6">
                  <label className="form-label">Fecha y Hora de Fin</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={eventData.endDate}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* Campos adicionales */}
              <h3 className="mt-4">Campos Adicionales</h3>
              {eventData.registrationFields.map((field, index) => (
                <div key={index} className="card mb-3 p-3">
                  <div className="mb-2">
                    <label className="form-label">Nombre del Campo</label>
                    <input
                      type="text"
                      value={field.fieldName}
                      onChange={(e) =>
                        handleFieldChange(index, { fieldName: e.target.value })
                      }
                      className="form-control"
                      placeholder="Ej: Empresa, Edad, etc."
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Tipo de Campo</label>
                    <select
                      value={field.fieldType}
                      onChange={(e) =>
                        handleFieldChange(index, {
                          fieldType: e.target.value as "text" | "number" | "email" | "date",
                        })
                      }
                      className="form-select"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="email">Correo</option>
                      <option value="date">Fecha</option>
                    </select>
                  </div>
                  <div className="form-check mb-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        handleFieldChange(index, { required: e.target.checked })
                      }
                      className="form-check-input"
                      id={`required-${index}`}
                    />
                    <label className="form-check-label" htmlFor={`required-${index}`}>
                      Campo obligatorio
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeField(index)}
                  >
                    Eliminar Campo
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary mb-3"
                onClick={addField}
              >
                Agregar Campo
              </button>

              {/* Personalización del Evento */}
              <h3 className="mt-4">Personalización del Evento</h3>
              <div className="mb-3">
                <label className="form-label">Imagen Key Visual</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleKeyVisualChange}
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Color Primario (Fondo)</label>
                <input
                  type="color"
                  name="primaryColor"
                  value={eventData.primaryColor || "#311676"}
                  onChange={handleChange}
                  className="form-control form-control-color"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Color Secundario (Texto)</label>
                <input
                  type="color"
                  name="secondaryColor"
                  value={eventData.secondaryColor || "#ffffff"}
                  onChange={handleChange}
                  className="form-control form-control-color"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Tipografía</label>
                <select
                  name="fontFamily"
                  value={eventData.fontFamily}
                  onChange={handleFontFamilyChange}
                  className="form-select"
                >
                  {googleFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                {id ? "Actualizar Evento" : "Crear Evento"}
              </button>
            </div>

            {/* Columna Derecha: Previsualización */}
            <div className="col-md-6">
              <h2>Previsualización del Formulario de Registro</h2>
              <div className="border p-3 rounded bg-light">
                {renderFormPreview()}
              </div>
            </div>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
