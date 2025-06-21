import Transmision from '../schema/transmision.js';

// Almacén para los últimos datos por IMEI (debe ser compartido por la app principal)
export const gpsDataCache = new Map();
// Los clientes WebSocket deben ser inyectados desde el servidor principal
let clients = null;
export function setClientsMap(map) {
  clients = map;
}

// --- Limpieza y filtrado de datos GPS ---
export function cleanAndFilterGpsData(decodedData) {
  if (!decodedData?.records?.length) {
    console.warn("No hay registros para procesar.");
    return decodedData;
  }

  const isValidCoordinate = (lat, lon) => {
    if (lat === 0 && lon === 0) return false;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
    if (lat % 90 === 0 && lon % 180 === 0) return false;
    if (lat.toFixed(4) === lon.toFixed(4)) return false;
    return true;
  };

  const isGarbageValue = (value) => {
    if (value === Number.MAX_VALUE || value === Number.MIN_VALUE) return true;
    if (Math.log2(Math.abs(value)) % 1 === 0) return true;
    const str = Math.abs(value).toString().replace('.', '');
    if (new Set(str.split('')).size === 1) return true;
    return false;
  };

  const validRecords = [];
  const seenRecords = new Set();

  for (const record of decodedData.records) {
    const { latitude, longitude, speed, altitude, timestamp } = record;
    if (isGarbageValue(latitude) || isGarbageValue(longitude)) continue;
    if (!isValidCoordinate(latitude, longitude)) continue;
    if (speed < 0 || speed > 1000) continue;
    if (altitude < -1000 || altitude > 20000) continue;

    const precision = 6;
    const latKey = latitude.toFixed(precision);
    const lonKey = longitude.toFixed(precision);
    const recordKey = `${timestamp}_${latKey}_${lonKey}`;
    if (seenRecords.has(recordKey)) continue;
    seenRecords.add(recordKey);

    validRecords.push({
      ...record,
      speed: Math.max(0, Math.min(speed, 1000)),
      altitude: Math.max(-1000, Math.min(altitude, 20000)),
      angle: record.angle % 360
    });
  }

  return {
    ...decodedData,
    records: validRecords,
    numberOfRecords: validRecords.length,
    recordsLeft: Math.min(decodedData.recordsLeft, validRecords.length)
  };
}

// --- Procesamiento y emisión de datos GPS por WebSocket ---
export function processAndEmitGpsData(decodedData) {
  if (!clients) {
    console.warn('No clients map set for WebSocket emission.');
    return;
  }
  if (!decodedData?.imei || !decodedData?.records?.length) return;

  const cleanedData = cleanAndFilterGpsData(decodedData);
  if (cleanedData.records.length === 0) return;

  cleanedData.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const cacheKey = cleanedData.imei;
  const cachedData = gpsDataCache.get(cacheKey);

  const getRecordKey = (record) =>
    `${record.timestamp}_${record.latitude.toFixed(6)}_${record.longitude.toFixed(6)}`;

  let hasNewData = false;
  const newRecordsToEmit = [];
  for (const record of cleanedData.records) {
    const recordKey = getRecordKey(record);
    if (!cachedData?.recordsMap || !cachedData.recordsMap[recordKey]) {
      hasNewData = true;
      newRecordsToEmit.push(record);
    }
  }
  if (!hasNewData) return;

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
      try {
        if (client.readyState === 1 && info.authenticated) {
          client.send(JSON.stringify({ type: 'gps-data', data }));
        }
      } catch (error) {
        // Silenciar error individual
      }
    }
  };

  const allZeroSpeed = newRecordsToEmit.every((record) => record.speed === 0);
  if (allZeroSpeed) {
    const mostRecentRecord = newRecordsToEmit[newRecordsToEmit.length - 1];
    emitToAuthenticated({
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
    });
  } else {
    newRecordsToEmit.forEach((record) => {
      emitToAuthenticated({
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
      });
    });
  }

  gpsDataCache.set(cacheKey, dataToStore);
}

// --- Guardar registros en la base de datos ---
export async function saveRecord(decodedData) {
  try {
    if (!decodedData?.imei || !decodedData?.records?.length) return;
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
        punto: {
          type: 'Point',
          coordinates: [record.longitude, record.latitude]
        },
        altitude: record.altitude || 0,
        angle: record.angle || 0,
        satellites: record.satellites || 0,
        speed: record.speed || 0,
        hdop: record.hdop || 0,
        eventId: record.eventId || 0,
        ioElements: record.ioElements || {}
      });
    }
  } catch (error) {
    console.error('Error saving GPS records to database:', error.message);
  }
}