const net = require('net');
const ruptela = require('ruptela');

const server = net.createServer((socket) => {
  console.log(`Nueva conexión desde ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data) => {
    console.log(`Datos recibidos de ${socket.remoteAddress}:${socket.remotePort}:`, data);
    
    try {
      const parsedData = ruptela.parse(data);
      console.log('Datos parseados:', JSON.stringify(parsedData, null, 2));
    } catch (error) {
      console.error(`Error al procesar datos: ${error.message}`);
    }
  });

  socket.on('end', () => {
    console.log(`Conexión cerrada con ${socket.remoteAddress}:${socket.remotePort}`);
  });
});

server.listen(8989, () => {
  console.log('Servidor TCP iniciado en el puerto 8989');
});