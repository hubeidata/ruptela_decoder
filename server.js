const net     = require('net');
const ruptela = require('ruptela');

const server = net.createServer(socket => {
  console.log(`Nueva conexión desde ${socket.remoteAddress}:${socket.remotePort}`);

  // Buffer donde iremos acumulando los fragmentos
  let buffer = Buffer.alloc(0);

  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    // Intentamos extraer tantos paquetes completos como haya
    while (buffer.length) {
      let result;
      try {
        // Si no hay paquete completo, ruptela.parse lanzará 'Buffer underflow'
        result = ruptela.parse(buffer);
      } catch (err) {
        // Si es por falta de bytes, salimos del loop y esperamos más datos
        if (err.message.includes('Buffer underflow')) {
          break;
        }
        // Otro error fatal: lo logueamos, descartamos buffer y salimos
        console.error('Error inesperado al parsear:', err);
        buffer = Buffer.alloc(0);
        break;
      }

      // Si llegamos aquí, parseó un paquete completo:
      console.log('Datos parseados:', JSON.stringify(result, null, 2));

      // Envío del ACK de la librería
      socket.write(result.ack);

      // Cortamos del buffer los bytes del paquete ya procesado
      const packetLen = result.data.packet_length;
      buffer = buffer.slice(packetLen);
    }
  });

  socket.on('end', () => {
    console.log(`Conexión cerrada con ${socket.remoteAddress}:${socket.remotePort}`);
  });
  socket.on('error', err => {
    console.error(`Error en conexión ${socket.remoteAddress}:${socket.remotePort}:`, err);
  });
});

server.listen(8989, () => {
  console.log('Servidor TCP iniciado en el puerto 8989');
});
