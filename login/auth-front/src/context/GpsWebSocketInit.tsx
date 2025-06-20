import { useEffect, useRef } from "react";
import { useGpsContext } from "./GpsContext";

// --- Funciones de encriptado compatibles con Node.js ---
function getKey(secret: string) {
  // Deriva una clave de 32 bytes desde la cadena de entorno
  return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
}

async function encrypt(text: string, secret: string) {
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const keyBuffer = await getKey(secret);
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    new TextEncoder().encode(text)
  );
  const encryptedHex = Array.from(new Uint8Array(encryptedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ivHex}:${encryptedHex}`;
}

export function GpsWebSocketInit() {
  const { gpsMap } = useGpsContext();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    const wsUrl = (import.meta.env.VITE_WS_URL || "ws://localhost:5000").trim();
    const encrptKey = (import.meta.env.VITE_ENCRPT_KEY || "").trim();

    async function connect() {
      if (isUnmounted) return;
      console.log(`[WebSocket] Intentando conectar a ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("[WebSocket] Conectado");
        // Autenticación: envía el token encriptado
        if (encrptKey) {
          const token = await encrypt(encrptKey, encrptKey);
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