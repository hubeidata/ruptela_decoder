const net = require('net');
const ruptela = require('ruptela');

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0); // Buffer acumulador

  console.log(`Nueva conexión desde ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]); // Acumula datos

    // Intentar parsear solo si hay suficiente longitud mínima (ej: 25 bytes de header)
    while (buffer.length >= 25) {
      try {
        const parsedData = ruptela.parse(buffer);
        console.log('Datos parseados:', JSON.stringify(parsedData, null, 2));
        buffer = buffer.slice(parsedData.rawLength); // Elimina los bytes procesados
      } catch (error) {
        console.error(`Error al procesar datos: ${error.message}`);
        break; // Espera más datos si falla
      }
    }
  });

  socket.on('end', () => {
    console.log(`Conexión cerrada con ${socket.remoteAddress}:${socket.remotePort}`);
  });
});

server.listen(8989, () => {
  console.log('Servidor TCP iniciado en el puerto 8989');
});