import React from "react";
import PortalLayout from "../layout/PortalLayout";

export default function Recursos() {
  return (
    <PortalLayout>
      <div className="container my-4">
        <h1 className="mb-4">Recursos Humanos y Equipos</h1>
        <p>
          Aquí podrás gestionar y visualizar la información de personal y equipos registrados en el sistema.
        </p>
        {/* Puedes agregar aquí tablas, filtros o componentes adicionales según lo requieras */}
      </div>
    </PortalLayout>
  );
}