// src/routes/Dashboard.tsx
import React, { useEffect, useState } from "react";
import PortalLayout from "../layout/PortalLayout";
import { useAuth } from "../auth/AuthProvider";
import { API_URL } from "../auth/authConstants";
import { Link, useNavigate } from "react-router-dom";
import GoogleMapStatic from "../components/GoogleMapStatic";

const initialMapConfig = {
  center: { lat: -16.410471, lng: -71.53088 },
  zoom: 15
};

export default function Dashboard() {
  return (
    <PortalLayout>
      <div className="container my-4">
        <h1 className="mb-4">Dashboard</h1>
        <h2 className="mt-4">Mapa de Eventos</h2>
        <div style={{ position: "relative", width: "100%", height: "500px" }}>
          <GoogleMapStatic 
            initialCenter={initialMapConfig.center}
            initialZoom={initialMapConfig.zoom}
          />
        </div>
      </div>
    </PortalLayout>
  );
}