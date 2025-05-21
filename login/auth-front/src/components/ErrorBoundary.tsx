// Nuevo archivo: src/components/ErrorBoundary.tsx
import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div>Ocurrió un error al cargar el mapa.</div>;
    }
    return this.props.children;
  }
}