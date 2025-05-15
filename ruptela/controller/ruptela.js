import { Buffer } from 'buffer';

let coordinates = { latitude: null, longitude: null };

export const getCoordinates = async (request, response) => {
  response.json(coordinates);
};

export const gpsData = async (request, response) => {
  if (datos) {
    response.json({ data: datos.toString('hex') });
  } else {
    response.status(404).json({ error: 'No se han recibido datos de GPS.' });
  }
};

export const setCoordinates = async (request, response) => {
  const { latitude, longitude } = request.body;
  coordinates = { latitude, longitude };
  response.json({ message: 'Coordenadas guardadas correctamente', coordinates });
};

export const decodeData = async (request, response) => {
  const { hexData } = request.body;
  try {
    const decodedData = parseRuptelaPacketWithExtensions(hexData);
    response.status(200).json({ success: true, data: decodedData });
  } catch (error) {
    response.status(400).json({ success: false, error: error.message });
  }
};

export const parseRuptelaPacketWithExtensions = (hexData) => {
  const buffer = Buffer.from(hexData, 'hex');

  // Packet length
  const packetLength = buffer.readUInt16BE(0);
  const expectedLength = buffer.length - 4;
  if (packetLength !== expectedLength) {
    throw new Error(`Packet length mismatch: ${packetLength} vs ${expectedLength}`);
  }

  // IMEI
  const imei = buffer.slice(2, 10).readBigUInt64BE().toString();

  // Command ID
  const commandId = buffer.readUInt8(10);

  // Payload
  const payload = buffer.slice(11, buffer.length - 2);
  let offset = 0;

  const recordsLeft = payload.readUInt8(offset++);
  const numRecords = payload.readUInt8(offset++);
  const records = [];

  for (let i = 0; i < numRecords; i++) {
    if (offset + 25 > payload.length) throw new Error('Insufficient data for record header');

    const record = {};
    record.timestamp = new Date(payload.readUInt32BE(offset) * 1000);
    offset += 4;
    record.timestampExtension = payload.readUInt8(offset++);
    record.recordExtension = payload.readUInt8(offset++);
    record.priority = payload.readUInt8(offset++);
    record.longitude = payload.readInt32BE(offset) / 1e7;
    offset += 4;
    record.latitude = payload.readInt32BE(offset) / 1e7;
    offset += 4;
    record.altitude = payload.readUInt16BE(offset) / 10;
    offset += 2;
    record.angle = payload.readUInt16BE(offset) / 100;
    offset += 2;
    record.satellites = payload.readUInt8(offset++);
    record.speed = payload.readUInt16BE(offset);
    offset += 2;
    record.hdop = payload.readUInt8(offset++) / 10;
    record.eventId = payload.readUInt16BE(offset);
    offset += 2;

    // IO Elements
    const ioElements = {};
    const ioSizes = [1, 2, 4, 8];
    for (const size of ioSizes) {
      if (offset >= payload.length) break;
      const count = payload.readUInt8(offset++);
      ioElements[size] = {};
      for (let j = 0; j < count; j++) {
        if (offset >= payload.length) throw new Error('Unexpected end of payload while parsing IO elements');
        const ioId = payload.readUInt8(offset++);
        let value;
        switch (size) {
          case 1:
            value = payload.readUInt8(offset);
            offset += 1;
            break;
          case 2:
            value = payload.readUInt16BE(offset);
            offset += 2;
            break;
          case 4:
            value = payload.readUInt32BE(offset);
            offset += 4;
            break;
          case 8:
            value = Number(payload.readBigUInt64BE(offset));
            offset += 8;
            break;
        }
        ioElements[size][ioId] = value;
      }
    }

    record.ioElements = ioElements;
    records.push(record);
  }

  const crc = buffer.readUInt16BE(buffer.length - 2);

  return { packetLength, imei, commandId, recordsLeft, numberOfRecords: numRecords, records, crc, offset };
};
