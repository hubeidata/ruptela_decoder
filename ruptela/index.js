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
}

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
      console.warn('[Evento] No se encontró el evento en el cuerpo');
      return res.status(400).send('Evento inválido');
    }

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
    console.error('[Evento] Error al procesar evento:', error.message);
    res.status(500).send('Error interno');
  }
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const clients = new Map();
const gpsDataCache = new Map();

function logRejection(imei, message, details = {}) {
  console.log(`[Rechazo] ${new Date().toISOString()} IMEI: ${imei || 'Desconocido'} | ${message}`, details);
}

function cleanAndFilterGpsData(decodedData) {
    const rejectionReasons = {
        invalidCoordinates: 0,
        garbageValues: 0,
        speedOutOfRange: 0,
        altitudeOutOfRange: 0,
        duplicateRecords: 0
    };

    if (!decodedData?.records?.length) return { ...decodedData, rejectionReasons };

    const isValidCoordinate = (lat, lon) => {
        if (lat === 0 && lon === 0) return false;
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
        return true;
    };

    const isGarbageValue = (value) => {
        const str = Math.abs(value).toString().replace('.', '');
        return new Set(str.split('')).size === 1;
    };

    const validRecords = [];
    const seenRecords = new Set();

    for (const record of decodedData.records) {
        let rejected = false;

        // Validación de coordenadas
        if (!isValidCoordinate(record.latitude, record.longitude)) {
            rejectionReasons.invalidCoordinates++;
            rejected = true;
        }

        // Validación de valores basura
        if (!rejected && (isGarbageValue(record.latitude) || isGarbageValue(record.longitude))) {
            rejectionReasons.garbageValues++;
            rejected = true;
        }

        // Validación de velocidad
        if (!rejected && (record.speed < 0 || record.speed > 1000)) {
            rejectionReasons.speedOutOfRange++;
            rejected = true;
        }

        // Validación de altitud
        if (!rejected && (record.altitude < -1000 || record.altitude > 20000)) {
            rejectionReasons.altitudeOutOfRange++;
            rejected = true;
        }

        if (rejected) continue;

        // Detección de duplicados
        const recordKey = `${record.timestamp}_${record.latitude.toFixed(6)}_${record.longitude.toFixed(6)}`;
        if (seenRecords.has(recordKey)) {
            rejectionReasons.duplicateRecords++;
            continue;
        }

        seenRecords.add(recordKey);
        validRecords.push(record);
    }

    return {
        ...decodedData,
        records: validRecords,
        rejectionReasons,
        numberOfRecords: validRecords.length,
        recordsLeft: Math.min(decodedData.recordsLeft, validRecords.length)
    };
}

function processAndEmitGpsData(decodedData) {
    if (!decodedData?.imei || !decodedData?.records?.length) {
        logRejection(decodedData?.imei, 'Datos incompletos', {
            hasImei: !!decodedData?.imei,
            recordsCount: decodedData?.records?.length || 0
        });
        return;
    }

    const cleanedData = cleanAndFilterGpsData(decodedData);
    
    if (cleanedData.records.length === 0) {
        logRejection(decodedData.imei, 'Todos los registros filtrados', {
            originalRecords: decodedData.records.length,
            rejectionReasons: cleanedData.rejectionReasons
        });
        return;
    }

    const cacheKey = cleanedData.imei;
    const cachedData = gpsDataCache.get(cacheKey);

    let hasNewData = false;
    const newRecordsToEmit = [];
    const seenCacheKeys = new Set();

    for (const record of cleanedData.records) {
        const recordKey = `${record.timestamp}_${record.latitude.toFixed(6)}_${record.longitude.toFixed(6)}`;
        if (!cachedData?.recordsMap || !cachedData.recordsMap[recordKey]) {
            hasNewData = true;
            newRecordsToEmit.push(record);
            seenCacheKeys.add(recordKey);
        }
    }

    if (!hasNewData) {
        logRejection(decodedData.imei, 'Sin datos nuevos', {
            cachedRecords: cachedData?.records?.length || 0,
            newRecords: cleanedData.records.length
        });
        return;
    }

    const emitToAuthenticated = (data) => {
        let emitted = false;
        const authClients = Array.from(clients.values()).filter(v => v.authenticated);
        
        authClients.forEach((info, client) => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'gps-data', data }));
                emitted = true;
            }
        });

        if (!emitted) {
            logRejection(data.imei, 'Sin clientes autenticados', {
                totalClients: clients.size,
                authenticated: authClients.length
            });
        }
    };

    const dataToStore = {
        imei: cleanedData.imei,
        records: [...newRecordsToEmit, ...(cachedData?.records || [])].slice(0, 100),
        recordsMap: [...seenCacheKeys, ...(cachedData?.recordsMap ? Object.keys(cachedData.recordsMap) : [])]
            .reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        lastUpdated: new Date(),
    };

    gpsDataCache.set(cacheKey, dataToStore);

    newRecordsToEmit.forEach(record => {
        const dataToEmit = {
            imei: cleanedData.imei,
            lat: record.latitude,
            lng: record.longitude,
            timestamp: record.timestamp,
            speed: record.speed,
            altitude: record.altitude,
            additionalData: record.ioElements,
        };
        emitToAuthenticated(dataToEmit);
    });
}

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
                    ws.send(JSON.stringify({ type: 'authentication-success' }));
                } else {
                    ws.send(JSON.stringify({ type: 'authentication-error', message: 'Token inválido' }));
                    ws.close();
                }
            }
        } catch (error) {
            console.error('[WS] Error de autenticación:', error.message);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Servidor HTTP/WS en puerto ${PORT}`);
});

const tcpServer = net.createServer((socket) => {
    socket.on('data', (data) => {
        try {
            const hexData = data.toString('hex');
            const decodedData = parseRuptelaPacketWithExtensions(hexData);
            
            if (!decodedData) {
                logRejection(null, 'Paquete no parseado', { hexData: hexData.slice(0, 50) });
                return;
            }
            
            processAndEmitGpsData(decodedData);
        } catch (error) {
            logRejection(null, 'Error procesando datos TCP', { error: error.message });
        }
    });

    socket.on('error', (err) => {
        logRejection(null, 'Error de conexión TCP', { error: err.message });
    });
});

tcpServer.listen(TCP_PORT, () => {
    console.log(`Servidor TCP en puerto ${TCP_PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('[Critical] Excepción no capturada:', err.message);
});