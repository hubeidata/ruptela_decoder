import { useEffect, useRef } from "react";
import { encrypt } from "../utils/encrypt"; // Importa las funciones de encriptado y desencriptado
import { useGpsContext } from "./GpsContext";

export function GpsWebSocketInit() {
  const { gpsMap } = useGpsContext();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    // Logs para depurar las variables de entorno
    console.log("[WebSocket] Variables de entorno:");
    console.log("VITE_WS_URL:", import.meta.env.VITE_WS_URL);
    console.log("VITE_ENCRPT_KEY:", import.meta.env.VITE_ENCRPT_KEY);
    console.log(
      "Todas las variables VITE:",
      JSON.stringify(
        Object.keys(import.meta.env)
          .filter((key) => key.startsWith("VITE_"))
          .reduce((acc, key) => {
            acc[key] = import.meta.env[key];
            return acc;
          }, {} as Record<string, any>)
      )
    );

    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:5000";
    const encrptKey = import.meta.env.VITE_ENCRPT_KEY;

    console.log(`[WebSocket] URL final a usar: ${wsUrl}`);
    console.log(`[WebSocket] Clave de encriptación disponible: ${!!encrptKey}`);

    function connect() {
      if (isUnmounted) return;
      console.log(`[WebSocket] Intentando conectar a ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Conectado");
        // Autenticación opcional:
        if (encrptKey) {
          const token = encrypt(encrptKey);
          ws.send(JSON.stringify({ type: "authenticate", token }));
          console.log("[WebSocket] Token de autenticación enviado");
        }

        // Enviar ping cada 15 segundos para mantener la conexión activa
        if (pingInterval.current) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
            console.log("[WebSocket] Ping enviado");
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        console.log("[WebSocket] Mensaje recibido:", event.data);
        const msg = JSON.parse(event.data);
        if (msg.type === "gps-data") {
          const data = msg.data;
          if (data.imei) {
            gpsMap.set(data.imei, data);
          }
        }
        if (msg.type === "authentication-success") {
          console.log("[WebSocket] Autenticación exitosa");
        }
        if (msg.type === "authentication-error") {
          console.error("[WebSocket] Error de autenticación:", msg.message);
        }
      };

      ws.onerror = (err) => {
        console.error("[WebSocket] Error:", err);
      };

      ws.onclose = (event) => {
        console.warn(
          `[WebSocket] Conexión cerrada (código: ${event.code}, motivo: ${event.reason}). Reintentando en 5 segundos...`
        );
        if (pingInterval.current) clearInterval(pingInterval.current);
        if (!isUnmounted) {
          reconnectTimeout.current = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
      console.log("[WebSocket] Limpieza de recursos y cierre de conexión");
    };
  }, [gpsMap]);

  return null; // Este componente no renderiza nada
}