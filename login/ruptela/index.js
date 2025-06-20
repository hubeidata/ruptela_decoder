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
import sequelize from './config/database.js';
import Transmision from './schema/transmision.js';


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
    if (!decodedData?.records?.length) {
        console.warn("No hay registros para procesar.");
        return decodedData;
    }

    const isValidCoordinate = (lat, lon) => {
        if (lat === 0 && lon === 0) {
            console.warn(`Coordenadas inválidas: lat=0 y lon=0`);
            return false;
        }
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            console.warn(`Coordenadas fuera de rango: lat=${lat}, lon=${lon}`);
            return false;
        }
        if (lat % 90 === 0 && lon % 180 === 0) {
            console.warn(`Coordenadas límite descartadas: lat=${lat}, lon=${lon}`);
            return false;
        }

        const coordStr = `${lat}${lon}`;
        if (/(\d{3})\1/.test(coordStr)) {
            console.warn(`Coordenadas con patrón repetitivo descartadas: lat=${lat}, lon=${lon}`);
            return false;
        }
        if (lat.toFixed(4) === lon.toFixed(4)) {
            console.warn(`Latitud igual a longitud con 4 decimales: lat=${lat}, lon=${lon}`);
            return false;
        }

        return true;
    };

    const isGarbageValue = (value) => {
        if (value === Number.MAX_VALUE || value === Number.MIN_VALUE) {
            console.warn(`Valor basura detectado (MAX/MIN): ${value}`);
            return true;
        }
        if (Math.log2(Math.abs(value)) % 1 === 0) {
            console.warn(`Valor sospechoso (potencia de 2): ${value}`);
            return true;
        }

        const str = Math.abs(value).toString().replace('.', '');
        if (new Set(str.split('')).size === 1) {
            console.warn(`Valor con dígitos repetidos: ${value}`);
            return true;
        }

        return false;
    };

    const validRecords = [];
    const seenRecords = new Set();

    for (const record of decodedData.records) {
        const { latitude, longitude, speed, altitude, timestamp } = record;

        if (isGarbageValue(latitude) || isGarbageValue(longitude)) {
            console.warn(`Registro descartado por valor basura en lat/lon: lat=${latitude}, lon=${longitude}`);
            continue;
        }

        if (!isValidCoordinate(latitude, longitude)) {
            console.warn(`Registro descartado por coordenadas inválidas: lat=${latitude}, lon=${longitude}`);
            continue;
        }

        if (speed < 0 || speed > 1000) {
            console.warn(`Registro descartado por velocidad fuera de rango: speed=${speed}`);
            continue;
        }

        if (altitude < -1000 || altitude > 20000) {
            console.warn(`Registro descartado por altitud fuera de rango: altitude=${altitude}`);
            continue;
        }

        const precision = 6;
        const latKey = latitude.toFixed(precision);
        const lonKey = longitude.toFixed(precision);
        const recordKey = `${timestamp}_${latKey}_${lonKey}`;

        if (seenRecords.has(recordKey)) {
            console.info(`Registro duplicado descartado: timestamp=${timestamp}, lat=${latKey}, lon=${lonKey}`);
            continue;
        }

        seenRecords.add(recordKey);

        const cleanedRecord = {
            ...record,
            speed: Math.max(0, Math.min(speed, 1000)),
            altitude: Math.max(-1000, Math.min(altitude, 20000)),
            angle: record.angle % 360
        };

        validRecords.push(cleanedRecord);
    }

    console.info(`Registros válidos conservados: ${validRecords.length} de ${decodedData.records.length}`);

    return {
        ...decodedData,
        records: validRecords,
        numberOfRecords: validRecords.length,
        recordsLeft: Math.min(decodedData.recordsLeft, validRecords.length)
    };
}
function processAndEmitGpsData(decodedData) {
    if (!decodedData?.imei) {
        console.warn("Procesamiento omitido: IMEI no presente en decodedData.");
        return;
    }
    if (!decodedData?.records?.length) {
        console.warn(`Procesamiento omitido: decodedData no contiene registros. IMEI=${decodedData.imei}`);
        return;
    }

    const cleanedData = cleanAndFilterGpsData(decodedData);
    if (cleanedData.records.length === 0) {
        console.warn(`Todos los registros fueron descartados tras limpieza para IMEI=${decodedData.imei}`);
        return;
    }

    cleanedData.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const cacheKey = cleanedData.imei;
    const cachedData = gpsDataCache.get(cacheKey);

    const getRecordKey = (record) => {
        return `${record.timestamp}_${record.latitude.toFixed(6)}_${record.longitude.toFixed(6)}`;
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

    if (!hasNewData) {
        console.info(`No se encontraron nuevos registros para IMEI=${cleanedData.imei}`);
        return;
    }

    console.info(`Se encontraron ${newRecordsToEmit.length} nuevos registros para IMEI=${cleanedData.imei}`);

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
        let count = 0;
        for (const [client, info] of clients.entries()) {
            if (client.readyState === 1 && info.authenticated) {
                client.send(JSON.stringify({ type: 'gps-data', data }));
                count++;
            }
        }
        console.info(`Datos emitidos a ${count} clientes autenticados. IMEI=${data.imei}`);
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
        console.info(`Todos los registros nuevos tienen velocidad 0. Emitiendo solo el más reciente para IMEI=${cleanedData.imei}`);
        emitToAuthenticated(dataToEmit);
    } else {
        console.info(`Emitiendo ${newRecordsToEmit.length} registros nuevos para IMEI=${cleanedData.imei}`);
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
                deviceno: "",
                carlicense: "",
                additionalData: record.ioElements,
            };
            emitToAuthenticated(dataToEmit);
        });
    }

    gpsDataCache.set(cacheKey, dataToStore);
    console.info(`Datos almacenados en caché para IMEI=${cleanedData.imei}. Total de registros almacenados: ${limitedRecords.length}`);
}

// Function to save GPS records to the database
async function saveRecord(decodedData) {
  try {
    if (!decodedData?.imei || !decodedData?.records?.length) {
      console.log('No valid data to save');
      return;
    }
    
    console.log(`Saving ${decodedData.records.length} records for IMEI: ${decodedData.imei}`);
    
    // Process each record in the decoded data
    for (const record of decodedData.records) {
      await Transmision.create({
        imei: decodedData.imei,
        commandId: decodedData.commandId,
        timestamp: record.timestamp,
        recordIndex: record.recordIndex || 0,
        timestampExtension: record.timestampExtension || 0,
        recordExtension: record.recordExtension || 0,
        priority: record.priority || 0,
        longitude: record.longitude,
        latitude: record.latitude,
        altitude: record.altitude || 0,
        angle: record.angle || 0,
        satellites: record.satellites || 0,
        speed: record.speed || 0,
        hdop: record.hdop || 0,
        eventId: record.eventId || 0,
        ioElements: record.ioElements || {}
      });
    }
    
    console.log(`Successfully saved ${decodedData.records.length} records to database`);
  } catch (error) {
    console.error('Error saving GPS records to database:', error.message);
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

// Sincronizar base de datos y luego iniciar el servidor HTTP
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos sincronizada');
    // Iniciar servidor HTTP
    httpServer.listen(PORT, () => {
        console.log(`Servidor HTTP y WebSocket escuchando en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al sincronizar la base de datos:', err);
  });

// Servidor TCP optimizado y robusto
const tcpServer = net.createServer({ keepAlive: true, allowHalfOpen: false }, (socket) => {
    // Habilita KeepAlive cada 60 segundos para mantener activa la conexión
    socket.setKeepAlive(true, 60000);

    socket.on('data', async (data) => {
        try {
            socket.write(Buffer.from('0002640113BC', 'hex'));
            console.log('ACK enviado');
            const hexData = data.toString('hex');
            console.log('Paquete recibido (hex):', hexData);
            //const decodedData = parseRuptelaPacketWithExtensions(hexData);
            const decodedData = parseRuptelaPacket(hexData);
            console.log('Paquete decodificado:', JSON.stringify(decodedData, null, 2));
            
            // Process the data for WebSocket clients
            processAndEmitGpsData(decodedData);
            
            // Save the data to the database
            await saveRecord(decodedData);
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