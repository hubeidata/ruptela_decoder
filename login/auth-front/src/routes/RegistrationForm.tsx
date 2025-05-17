// src/routes/RegistrationForm.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_URL } from "../auth/authConstants";

interface Branding {
  keyVisual?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationFields?: AdditionalField[];
  branding?: Branding;
  publicLink?: string;
}

interface AdditionalField {
  fieldName: string;
  fieldType: "text" | "number" | "email" | "date";
  required: boolean;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  document: string;
  additional?: { [key: string]: string };
}

const defaultFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  document: "",
  additional: {},
};

export default function RegistrationForm() {
  const { publicLink } = useParams<{ publicLink: string }>();
  console.log("RegistrationForm: publicLink =", publicLink);

  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");

  useEffect(() => {
    async function fetchEvent() {
      console.log("Intentando obtener el evento público con publicLink:", publicLink);
      // Asegúrate de que API_URL esté definido correctamente.
      const url = `${API_URL}/public/events/${publicLink}`;
      console.log("URL de fetch:", url);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        console.log("Respuesta de la API:", response);
        if (!response.ok) {
          console.error("La respuesta no fue exitosa. Status:", response.status, response.statusText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Datos del evento recibidos:", data);
        if (!data.body) {
          console.error("No se encontró la propiedad 'body' en la respuesta");
        }
        setEventData(data.body);
      } catch (error) {
        console.error("Error al cargar el evento público:", error);
        setFetchError("Error al cargar el evento. Intenta nuevamente.");
      } finally {
        setLoading(false);
        console.log("Finaliza fetchEvent. loading =", false);
      }
    }
    if (publicLink) {
      fetchEvent();
    } else {
      console.error("No se proporcionó publicLink en los parámetros de la URL");
      setFetchError("PublicLink no especificado.");
      setLoading(false);
    }
  }, [publicLink]);

  console.log("Renderizando RegistrationForm. loading:", loading, "eventData:", eventData, "formData:", formData);

  // Función para manejar el submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit triggered. Form data:", formData);
    setSubmitError("");
    // Validar campos obligatorios
    if (!formData.name || !formData.phone || !formData.email || !formData.document) {
      console.error("Faltan campos obligatorios");
      setSubmitError("Complete todos los campos obligatorios.");
      return;
    }
    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error("Formato de correo inválido:", formData.email);
      setSubmitError("El correo electrónico no es válido.");
      return;
    }
    // Validar campos adicionales
    if (eventData?.registrationFields) {
      for (const field of eventData.registrationFields) {
        if (field.required) {
          const value = formData.additional ? formData.additional[field.fieldName] : "";
          if (!value) {
            console.error(`El campo adicional "${field.fieldName}" es obligatorio pero no se completó.`);
            setSubmitError(`El campo adicional "${field.fieldName}" es obligatorio.`);
            return;
          }
        }
      }
    }
    try {
      const submitUrl = `${API_URL}/attendees/${eventData?._id}/register`;
      console.log("Enviando datos al endpoint de registro:", submitUrl);
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          document: formData.document,
          additionalData: formData.additional,
        }),
      });
      console.log("Respuesta del submit:", response);
      if (response.ok) {
        const data = await response.json();
        console.log("Datos recibidos del submit:", data);
        setSubmitSuccess(data.body.message);
        setFormData(defaultFormData);
      } else {
        console.error("Error en submit, respuesta no OK");
        setSubmitError("Error al registrarse en el evento.");
      }
    } catch (error) {
      console.error("Error en el submit:", error);
      setSubmitError("Error al enviar el formulario.");
    }
  };

  // Manejo de cambios para campos obligatorios
  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`handleDefaultChange: ${e.target.name} = ${e.target.value}`);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejo de cambios para campos adicionales
  const handleAdditionalChange = (fieldName: string, value: string) => {
    console.log(`handleAdditionalChange: ${fieldName} = ${value}`);
    setFormData({
      ...formData,
      additional: { ...formData.additional, [fieldName]: value },
    });
  };

  if (loading) {
    return (
      <div className="container my-4">
        <p>Cargando evento...</p>
      </div>
    );
  }

  if (fetchError || !eventData) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger" role="alert">
          {fetchError || "Evento no encontrado."}
        </div>
      </div>
    );
  }

  const branding = eventData.branding || {};
  const bgColor = branding.primaryColor || "#311676";
  const txtColor = branding.secondaryColor || "#ffffff";
  const fontFamily = branding.fontFamily || "Roboto";

  return (
    <div className="container my-4">
      {/* Visualización de la invitación */}
      {branding.keyVisual && (
        <div className="mb-3 text-center">
          <img src={branding.keyVisual} alt="Key Visual" className="img-fluid rounded" />
        </div>
      )}
      <div
        style={{
          backgroundColor: bgColor,
          color: txtColor,
          padding: "20px",
          textAlign: "center",
          textTransform: "uppercase",
          fontWeight: "bold",
          letterSpacing: "1px",
          fontFamily: fontFamily,
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0 }}>{eventData.title}</h1>
        <p style={{ fontSize: "1.2rem", margin: "5px 0" }}>
          {eventData.description || "Sin descripción"}
        </p>
        <p style={{ fontSize: "1.2rem", margin: 0 }}>
          {new Date(eventData.startDate).toLocaleString()} -{" "}
          {new Date(eventData.endDate).toLocaleString()}
        </p>
      </div>

      <h3 className="mt-4">Regístrate para el Evento</h3>
      {submitError && <div className="alert alert-danger">{submitError}</div>}
      {submitSuccess && <div className="alert alert-success">{submitSuccess}</div>}
      <form onSubmit={handleSubmit}>
        {/* Campos obligatorios */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleDefaultChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Teléfono</label>
          <input
            type="number"
            name="phone"
            className="form-control"
            value={formData.phone}
            onChange={handleDefaultChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Correo</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleDefaultChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Documento</label>
          <input
            type="text"
            name="document"
            className="form-control"
            value={formData.document}
            onChange={handleDefaultChange}
            required
          />
        </div>
        {/* Campos adicionales (si existen) */}
        {eventData.registrationFields && eventData.registrationFields.length > 0 && (
          <>
            <h4>Campos Adicionales</h4>
            {eventData.registrationFields.map((field, idx) => (
              <div className="mb-3" key={idx}>
                <label className="form-label">
                  {field.fieldName} {field.required && <span className="text-danger">*</span>}
                </label>
                <input
                  type={field.fieldType}
                  className="form-control"
                  value={formData.additional ? formData.additional[field.fieldName] || "" : ""}
                  onChange={(e) => handleAdditionalChange(field.fieldName, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}
          </>
        )}
        <button type="submit" className="btn btn-primary">
          Registrarse
        </button>
      </form>
    </div>
  );
}
