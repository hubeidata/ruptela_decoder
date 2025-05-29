// src/routes/EventDetail.tsx
import React, { useEffect, useState } from "react";
import PortalLayout from "../layout/PortalLayout";
import { useParams } from "react-router-dom";
import { API_URL } from "../auth/authConstants";
import { useAuth } from "../auth/AuthProvider";

interface Stats {
  confirmedCount: number;
  pendingCount: number;
  registrationHistory: Array<{
    _id: string;
    name: string;
    email: string;
    document: string;
    registeredAt: string;
  }>;
}

export default function EventDetail() {
  const { id } = useParams();
  const auth = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  async function fetchStats() {
    try {
      const response = await fetch(`${API_URL}/api/events/${id}/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.getAccessToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.body);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [id]);

  return (
    <PortalLayout>
      <h1>Estadísticas del Evento</h1>
      {stats ? (
        <div>
          <p>Registros Confirmados: {stats.confirmedCount}</p>
          <p>Asistentes Pendientes: {stats.pendingCount}</p>
          <h3>Historial de Registros</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Documento</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {stats.registrationHistory.map((attendee) => (
                <tr key={attendee._id}>
                  <td>{attendee.name}</td>
                  <td>{attendee.email}</td>
                  <td>{attendee.document}</td>
                  <td>{new Date(attendee.registeredAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => alert("Exportar a Excel (implementación pendiente)")}>
            Exportar a Excel
          </button>
        </div>
      ) : (
        <p>Cargando estadísticas...</p>
      )}
    </PortalLayout>
  );
}
