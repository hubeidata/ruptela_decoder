// src/routes/Dashboard.tsx
import React, { useEffect, useState } from "react";
import PortalLayout from "../layout/PortalLayout";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/authConstants";
import { Link, useNavigate } from "react-router-dom";

interface Event {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  publicLink?: string;
}

export default function Dashboard() {
  const auth = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();

  async function fetchEvents() {
    try {
      const response = await fetch(`${API_URL}/events`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.getAccessToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Ordenar eventos por fecha de inicio (los más próximos primero)
        const sorted = data.body.sort(
          (a: Event, b: Event) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        setEvents(sorted);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function handleCreate() {
    navigate("/events/new");
  }

  async function handleDelete(eventId: string, endDate: string) {
    if (new Date(endDate) <= new Date()) {
      alert("No se pueden eliminar eventos que ya han finalizado.");
      return;
    }
    if (window.confirm("¿Estás seguro de eliminar este evento?")) {
      try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.getAccessToken()}`,
          },
        });
        if (response.ok) {
          alert("Evento eliminado.");
          fetchEvents();
        } else {
          alert("Error al eliminar el evento.");
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  return (
    <PortalLayout>
      <div className="container my-4">
        <h1 className="mb-4">Dashboard</h1>
        <div className="mb-3">
          <button onClick={handleCreate} className="btn btn-primary">
            Crear Nuevo Evento
          </button>
        </div>
        <h2>Eventos Creados</h2>
        {events.length === 0 ? (
          <p>No hay eventos creados.</p>
        ) : (
          <ul className="list-group">
            {events.map((event) => (
              <li
                key={event._id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <h5>{event.title}</h5>
                  <p className="mb-0">
                    {new Date(event.startDate).toLocaleString()} -{" "}
                    {new Date(event.endDate).toLocaleString()}
                  </p>
                  {event.publicLink && (
                    <p className="mb-0">
                      Enlace Público:{" "}
                      <a
                        href={`/event/${event.publicLink}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {event.publicLink}
                      </a>
                    </p>
                  )}
                </div>
                <div>
                  <Link
                    to={`/events/${event._id}/edit`}
                    className="btn btn-sm btn-warning me-2"
                  >
                    Editar
                  </Link>
                  <Link
                    to={`/events/${event._id}`}
                    className="btn btn-sm btn-info me-2"
                  >
                    Ver Estadísticas
                  </Link>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(event._id, event.endDate)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PortalLayout>
  );
}
