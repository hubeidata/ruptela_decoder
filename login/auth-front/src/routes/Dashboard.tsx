// src/routes/Dashboard.tsx
import React from "react";
import PortalLayout from "../layout/PortalLayout";
import { DashboardContent } from "../components/DashboardContent";
import "../styles/reports.css";

const initialMapConfig = {
  center: { lat: -16.410471, lng: -71.53088 },
  zoom: 15
};

export default function Dashboard() {
  return (
    <PortalLayout>
      <DashboardContent initialMapConfig={initialMapConfig} />
    </PortalLayout>
  );
}