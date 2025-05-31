import net from 'net';

// Configura host y puerto
//const options = { host:'54.90.199.205',port: 6000 };
const options = { host:'3.91.102.49',port: 6000 };

console.log(`[${new Date().toISOString()}] Iniciando conexión a ${options.host}:${options.port}`);

const client = net.connect(options, () => {
  console.log(`[${new Date().toISOString()}] Conectado al servidor`);

  // Datos en hexadecimal
  const hexString = '0026000311118ffc2841010001682685300000d555b2f4f643defa64a162ac0a00000907000000009a54';

  const data = Buffer.from(hexString, 'hex');
  console.log(`[${new Date().toISOString()}] Enviando ${data.length} bytes: ${hexString}`);
  client.write(data);
});

// Cuando llegan datos del servidor
client.on('data', (chunk) => {
  const receivedHex = chunk.toString('hex').toUpperCase();
  console.log(`[${new Date().toISOString()}] Recibido ${chunk.length} bytes: ${receivedHex}`);
});

// Al cerrar la conexión
client.on('end', () => {
  console.log(`[${new Date().toISOString()}] Conexión terminada por el servidor`);
});

// Al ocurrir un error
client.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] Error de conexión:`, err);
});

// Opcional: detectar cierre completo
client.on('close', (hadError) => {
  console.log(
    `[${new Date().toISOString()}] Conexión cerrada${hadError ? ' con error' : ''}`
  );
});
