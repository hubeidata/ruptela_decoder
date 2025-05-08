// server.js
const ruptela = require('ruptela');
const dgram = require('dgram');

const server = dgram.createSocket('udp4');

server.on('message', (data, remote) => {
  console.log(`Datos recibidos de ${remote.address}:${remote.port}:`, data);
  
  try {
    // Usar la función correcta: ruptela.parse()
    const res = ruptela.parse(data); // <--- Cambio clave aquí
    console.log('Datos parseados:', JSON.stringify(res, null, 2));
  } catch (error) {
    console.error(`Error al procesar datos: ${error.message}`);
  }
});

server.bind(8989, () => {
  console.log('Servidor iniciado en el puerto... 8989');
});