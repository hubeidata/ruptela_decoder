// src/routes/PublicEvent.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationFields?: any[];
  branding?: {
    keyVisual?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  publicLink?: string;
}

export default function PublicEvent() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`http://44.210.136.233:3000/api/public/events/${publicLink}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setEvent(data.body);
      } catch (err: any) {
        console.error("Error al cargar el evento público:", err);
        setError("Error al cargar el evento. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }
    if (publicLink) {
      fetchEvent();
    }
  }, [publicLink]);

  if (loading) {
    return (
      <div className="container my-4">
        <p>Cargando evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container my-4">
        <p>Evento no encontrado.</p>
      </div>
    );
  }

  const branding = event.branding || {};
  const backgroundColor = branding.primaryColor || "#311676";
  const textColor = branding.secondaryColor || "#ffffff";
  const fontFamily = branding.fontFamily || "Roboto";

  return (
    <div className="container my-4">
      {branding.keyVisual && (
        <div className="mb-3">
          <img src={branding.keyVisual} alt="Key Visual" className="img-fluid rounded" />
        </div>
      )}
      <div
        style={{
          backgroundColor: backgroundColor,
          color: textColor,
          padding: "20px",
          textAlign: "center",
          textTransform: "uppercase",
          fontWeight: "bold",
          letterSpacing: "1px",
          fontFamily: fontFamily,
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0 }}>{event.title}</h1>
        <p style={{ fontSize: "1.2rem", margin: "5px 0" }}>
          {event.description || "Sin descripción"}
        </p>
        <p style={{ fontSize: "1.2rem", margin: 0 }}>
          {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
        </p>
      </div>
      <div className="text-center mt-4">
        <button type="button" className="btn btn-success">
          Registrarse
        </button>
      </div>
    </div>
  );
}
