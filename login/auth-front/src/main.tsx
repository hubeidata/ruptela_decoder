// src/main.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./routes/Login";
import Signup from "./routes/Signup";
import Dashboard from "./routes/Dashboard";
import EventForm from "./routes/EventForm";
import EventDetail from "./routes/EventDetail";
import RegistrationForm from "./routes/RegistrationForm";
import ProtectedRoute from "./routes/ProtectedRoute";
import Profile from "./routes/Profile";
import { AuthProvider } from "./auth/AuthProvider";
import { GpsProvider } from "./context/GpsContext";
import { GpsWebSocketInit } from "./context/GpsWebSocketInit";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/events/new", element: <EventForm /> },
      { path: "/events/:id/edit", element: <EventForm /> },
      { path: "/events/:id", element: <EventDetail /> },
      { path: "/me", element: <Profile /> },
    ],
  },
  // Definir una única ruta pública para el registro del evento.
  { path: "/event/:publicLink", element: <RegistrationForm /> },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <GpsProvider>
        <GpsWebSocketInit />
        <RouterProvider router={router} />
      </GpsProvider>
    </AuthProvider>
  </React.StrictMode>
);
