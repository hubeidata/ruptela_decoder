import WebSocket from 'ws';
import { encrypt } from './utils/encrypt.js';  // o donde esté tu función

const WS_URL = 'ws://ruptela.santiago.maxtelperu.com';  // o la URL pública
//const WS_URL = 'ws://localhost:5000';  // o la URL pública

// 1) Conecta
const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ Conectado al WebSocket');

  // 2) Autentícate
  const tokenEncriptado = encrypt(process.env.ENCRPT_KEY);
  ws.send(JSON.stringify({ type: 'authenticate', token: tokenEncriptado }));
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw);
  if (msg.type === 'authentication-success') {
    console.log('🔐 Autenticado correctamente, listo para recibir datos GPS...');
  }
  else if (msg.type === 'gps-data') {
    // 3) Aquí llegan los datos GPS uno a uno
    console.log('📍 Datos GPS recibidos:', msg.data);
    // msg.data = { imei, lat, lng, timestamp, speed, altitude, angle, ... }
  }
  else if (msg.type === 'authentication-error') {
    console.error('❌ Error de autenticación:', msg.message);
  }
});

ws.on('error', (err) => console.error('WebSocket error:', err));
ws.on('close', () => console.log('🔌 Conexión cerrada'));
