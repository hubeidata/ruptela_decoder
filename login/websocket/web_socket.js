import WebSocket from 'ws';
import { encrypt } from './utils/encrypt.js';  // o donde esté tu función

const WS_URL = 'wss://ruptela.santiago.maxtelperu.com';  // o la URL pública
//const WS_URL = 'ws://localhost:5000';  // o la URL pública

let ws;
let reconnectTimeout = null;
let pingInterval = null;

function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ Conectado al WebSocket');
    const tokenEncriptado = encrypt(process.env.ENCRPT_KEY);
    ws.send(JSON.stringify({ type: 'authenticate', token: tokenEncriptado }));

    // Enviar ping cada 15 segundos
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        console.log('➡️ Ping enviado');
      }
    }, 15000);
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.type === 'authentication-success') {
      console.log('🔐 Autenticado correctamente, listo para recibir datos GPS...');
    }
    else if (msg.type === 'gps-data') {
      console.log('📍 Datos GPS recibidos:', msg.data);
    }
    else if (msg.type === 'authentication-error') {
      console.error('❌ Error de autenticación:', msg.message);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('close', () => {
    console.log('🔌 Conexión cerrada. Intentando reconectar en 5 segundos...');
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      console.log('🔄 Reconectando...');
      connectWebSocket();
    }, 5000);
  });
}

connectWebSocket();
