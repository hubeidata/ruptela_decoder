const net = require('net');
const ruptela = require('ruptela');

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);

  console.log(`[CONEXIÓN] Nueva conexión desde ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data) => {
    console.log(`[DATOS] Recibidos ${data.length} bytes de ${socket.remoteAddress}`);
    buffer = Buffer.concat([buffer, data]);
    console.log(`[BUFFER] Longitud actual: ${buffer.length} bytes | Hex: ${buffer.toString('hex').substring(0, 50)}...`);

    while (buffer.length >= 25) {
      try {
        console.log(`[PARSEO] Intentando parsear buffer de ${buffer.length} bytes...`);
        const parsedData = ruptela.parse(buffer);
        console.log('[PARSEO] Datos parseados:', JSON.stringify(parsedData, null, 2));
        buffer = buffer.subarray(parsedData.rawLength);
        console.log(`[BUFFER] Bytes restantes: ${buffer.length}`);
      } catch (error) {
        console.error(`[ERROR] ${error.message}\nStack: ${error.stack}`);
        console.log(`[DEBUG] Buffer actual (hex): ${buffer.toString('hex')}`);
        break;
      }
    }
  });

  socket.on('end', () => {
    console.log(`[CONEXIÓN] Cerrada con ${socket.remoteAddress}:${socket.remotePort}`);
  });

  socket.on('error', (err) => {
    console.error(`[ERROR-SOCKET] ${err.message}`);
  });
});

server.listen(8989, '0.0.0.0', () => {
  console.log('[SERVIDOR] TCP iniciado en puerto 8989');
});