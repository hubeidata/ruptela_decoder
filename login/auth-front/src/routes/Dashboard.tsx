// src/routes/Dashboard.tsx
import React, { useEffect, useState } from "react";
import PortalLayout from "../layout/PortalLayout";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/authConstants";
import { Link, useNavigate } from "react-router-dom";

// ...existing code...
import GoogleMapStatic from "../components/GoogleMapStatic";
// ...existing code...

export default function Dashboard() {
  // ...existing code...
  return (
    <PortalLayout>
      <div className="container my-4">
        <h1 className="mb-4">Dashboard</h1>
        {/* ...otros componentes... */}
        <h2 className="mt-4">Mapa de Eventos</h2>
        <GoogleMapStatic />
        {/* ...resto del dashboard... */}
      </div>
    </PortalLayout>
  );
}