import express from 'express';
import cors from 'cors';
import net from 'net';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { parseRuptelaPacket, parseRuptelaPacketWithExtensions } from './controller/ruptela.js';
import { decrypt } from './utils/encrypt.js';
import { router_admin } from './routes/admin.js';
import { router_artemis } from './routes/artemis.js';
import router_reports from './routes/reports.js'; //// Nueva importacion


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
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/plain' }));

app.use('/api/admin', router_admin);
app.use('/api/artemis', router_artemis);
app.use('/api/reports', router_reports); // Nueva RUTAAA

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
          data: event
        }));
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error al procesar evento HikCentral:', error.message);
    res.status(500).send('Error interno');
  }
});

// 🆕 Ruta de salud para verificar APIs de reportes
app.get('/api/health/reports', (req, res) => {
    res.json({
        status: 'ok',
        service: 'reports-api',
        timestamp: new Date().toISOString(),
        endpoints: {
            personnel: '/api/reports/personnel',
            equipment: '/api/reports/equipment',
            volquetes: '/api/reports/equipment/volquetes-by-excavadora/:id',
            save: '/api/reports/save-report',
            history: '/api/reports/history',
            stats: '/api/reports/stats'
        }
    });
});


// Crear servidor HTTP
const httpServer = http.createServer(app);

// Crear WebSocket Server
const wss = new WebSocketServer({ server: httpServer });

const clients = new Map(); // Map<ws, { authenticated: boolean }>

// Almacén para los últimos datos por IMEI
const gpsDataCache = new Map();

function cleanAndFilterGpsData(decodedData) {
    // No filtrar nada, devolver todos los registros tal como llegan
    return {
        ...decodedData,
        records: decodedData.records || [],
        numberOfRecords: decodedData.records?.length || 0,
        recordsLeft: decodedData.recordsLeft || 0
    };
}

function processAndEmitGpsData(decodedData) {
    if (!decodedData?.imei || !decodedData?.records?.length) return;

    // Usar solo la función sin filtros
    const cleanedData = cleanAndFilterGpsData(decodedData);
    if (cleanedData.records.length === 0) return;

    cleanedData.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const cacheKey = cleanedData.imei;
    const cachedData = gpsDataCache.get(cacheKey);

    const getRecordKey = (record) => {
        //return `${record.timestamp}_${record.latitude.toFixed(6)}_${record.longitude.toFixed(6)}`;
        return `${record.timestamp}`;
    };

    let hasNewData = false;
    const newRecordsToEmit = [];

    for (const record of cleanedData.records) {
        const recordKey = getRecordKey(record);

        if (!cachedData?.recordsMap || !cachedData.recordsMap[recordKey]) {
            hasNewData = true;
            newRecordsToEmit.push(record);
        }
    }

    if (hasNewData) {
        const allRecords = [...newRecordsToEmit, ...(cachedData?.records || [])];
        const recordsMap = {};

        const uniqueRecords = [];
        for (const record of allRecords) {
            const recordKey = getRecordKey(record);
            if (!recordsMap[recordKey]) {
                recordsMap[recordKey] = true;
                uniqueRecords.push(record);
            }
        }

        const limitedRecords = uniqueRecords.slice(0, 100);

        const dataToStore = {
            imei: cleanedData.imei,
            records: limitedRecords,
            recordsMap: limitedRecords.reduce((map, record) => {
                map[getRecordKey(record)] = true;
                return map;
            }, {}),
            lastUpdated: new Date(),
        };

        const emitToAuthenticated = (data) => {
            for (const [client, info] of clients.entries()) {
                if (client.readyState === 1 && info.authenticated) {
                    client.send(JSON.stringify({ type: 'gps-data', data }));
                }
            }
        };

        const allZeroSpeed = newRecordsToEmit.every((record) => record.speed === 0);
        if (allZeroSpeed) {
            const mostRecentRecord = newRecordsToEmit[newRecordsToEmit.length - 1];
            const dataToEmit = {
                imei: cleanedData.imei,
                lat: mostRecentRecord.latitude,
                lng: mostRecentRecord.longitude,
                timestamp: mostRecentRecord.timestamp,
                speed: mostRecentRecord.speed,
                altitude: mostRecentRecord.altitude,
                angle: mostRecentRecord.angle ?? null,
                satellites: mostRecentRecord.satellites ?? null,
                hdop: mostRecentRecord.hdop ?? null,
                deviceno: "",
                carlicense: "",
                additionalData: mostRecentRecord.ioElements,
            };
            emitToAuthenticated(dataToEmit);
        } else {
            newRecordsToEmit.forEach((record) => {
                const dataToEmit = {
                    imei: cleanedData.imei,
                    lat: record.latitude,
                    lng: record.longitude,
                    timestamp: record.timestamp,
                    speed: record.speed,
                    altitude: record.altitude,
                    angle: record.angle ?? null,
                    satellites: record.satellites ?? null,
                    hdop: record.hdop ?? null,
                    deviceno: "", // puedes llenar esto dinámicamente si lo tienes
                    carlicense: "", // igual que arriba
                    additionalData: record.ioElements,
                };
                emitToAuthenticated(dataToEmit);
            });
        }

        gpsDataCache.set(cacheKey, dataToStore);
    }
}

// WebSocket connection logic
wss.on('connection', (ws) => {
    clients.set(ws, { authenticated: false });

    ws.on('message', (message) => {
        try {
            const { type, token } = JSON.parse(message);

            if (type === 'authenticate') {
                const decoded = decrypt(token);
                const JWT_SECRET = process.env.ENCRPT_KEY;

                if (decoded === JWT_SECRET) {
                    clients.set(ws, { authenticated: true });
                    ws.send(JSON.stringify({ type: 'authentication-success', message: 'Autenticación exitosa' }));
                } else {
                    ws.send(JSON.stringify({ type: 'authentication-error', message: 'Token inválido' }));
                    ws.close();
                }
            }
        } catch (error) {
            console.error('Mensaje malformado o error:', error.message);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Iniciar servidor HTTP
httpServer.listen(PORT, () => {
    console.log(`Servidor HTTP y WebSocket escuchando en el puerto ${PORT}`);
});

// Servidor TCP optimizado y robusto
const tcpServer = net.createServer({ keepAlive: true, allowHalfOpen: false }, (socket) => {
    // Habilita KeepAlive cada 60 segundos para mantener activa la conexión
    socket.setKeepAlive(true, 60000);

    socket.on('data', (data) => {
        try {
            socket.write(Buffer.from('0002640113BC', 'hex'));
            console.log('ACK enviado');
            const hexData = data.toString('hex');
            console.log('Paquete recibido (hex):', hexData);
            //const decodedData = parseRuptelaPacketWithExtensions(hexData);
            const decodedData = parseRuptelaPacket(hexData);
            console.log('Paquete decodificado:', JSON.stringify(decodedData, null, 2));
            processAndEmitGpsData(decodedData);
        } catch (error) {
            console.error('Error procesando datos GPS:', error);
        }
    });

    // Maneja errores específicos en sockets
    socket.on('error', (err) => {
        console.error('TCP socket error:', err.message);
        socket.destroy();  // libera el socket ante un error
    });

    // Maneja correctamente el evento de cierre de conexión
    socket.on('close', (hadError) => {
        if (hadError) {
            //console.warn(`Cliente TCP desconectado inesperadamente: ${socket.remoteAddress}:${socket.remotePort}`);
        } 
    });
});

tcpServer.listen(TCP_PORT, () => {
    console.log(`Servidor TCP escuchando en el puerto ${TCP_PORT}`);
});

// Manejo global de errores
process.on('uncaughtException', (err) => {
    console.error('Excepción no capturada:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada sin manejar:', promise, 'Razón:', reason);
});