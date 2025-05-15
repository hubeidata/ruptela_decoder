import express from 'express';
import cors from 'cors';
import net from 'net';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { parseRuptelaPacketWithExtensions } from './controller/ruptela.js';
import { decrypt } from './utils/encrypt.js';
import { router_admin } from './routes/admin.js';
import { router_artemis } from './routes/artemis.js';

dotenv.config();

const app = express();
const PORT = 5000;
const TCP_PORT = 6000;
const GETCORS = process.env.CORS;

// Configuración de CORS
const corsOptions = {
    origin: GETCORS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/plain' }));

app.use('/api/admin', router_admin);
app.use('/api/artemis', router_artemis);

// Ruta para recibir los eventos
app.post('/eventRcv', (req, res) => {
  try {
    const event = req.body?.params?.events?.[0];

    if (!event) {
      console.warn('No se encontró el evento en el cuerpo');
      return res.status(400).send('Evento inválido');
    }

    // Emitir a los clientes WebSocket autenticados
    for (const [client, info] of clients.entries()) {
      if (client.readyState === 1 && info.authenticated) {
        client.send(JSON.stringify({
          type: 'alert-data',
          data: event,
        }));
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error al procesar evento HikCentral:', error.message);
    res.status(500).send('Error interno');
  }
});

// Crear servidor HTTP
const httpServer = http.createServer(app);

// Crear WebSocket Server
const wss = new WebSocketServer({ server: httpServer });

const clients = new Map(); // Map<ws, { authenticated: boolean }>

// Almacén para los últimos datos por IMEI
const gpsDataCache = new Map();

// Función principal de logs de datos TCP
function logIncomingData(data) {
  const hexData = data.toString('hex');
  console.log('<< TCP Raw Data >>');
  console.log('Hex Length:', hexData.length);
  console.log('Buffer Length:', data.length);
  console.log('First 64 hex chars:', hexData.slice(0, 64));
  return hexData;
}

// Servidor TCP optimizado y robusto
const tcpServer = net.createServer({ keepAlive: true, allowHalfOpen: false }, (socket) => {
    socket.setKeepAlive(true, 60000);

    socket.on('data', (data) => {
        try {
            // Log de datos recibidos
            const hexData = logIncomingData(data);

            // Decodificar paquete
            const decodedData = parseRuptelaPacketWithExtensions(hexData);
            processAndEmitGpsData(decodedData);
        } catch (error) {
            console.error('Error procesando datos GPS:', error);
        }
    });

    socket.on('error', (err) => {
        console.error('TCP socket error:', err.message);
        socket.destroy();
    });

    socket.on('close', (hadError) => {
        if (hadError) {
            console.warn(`Cliente TCP desconectado inesperadamente: ${socket.remoteAddress}:${socket.remotePort}`);
        }
    });
});

tcpServer.listen(TCP_PORT, () => {
    console.log(`Servidor TCP escuchando en el puerto ${TCP_PORT}`);
});

// Iniciar servidor HTTP
httpServer.listen(PORT, () => {
    console.log(`Servidor HTTP y WebSocket escuchando en el puerto ${PORT}`);
});

// Manejo global de errores
process.on('uncaughtException', (err) => {
    console.error('Excepción no capturada:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada sin manejar:', promise, 'Razón:', reason);
});
