const net = require('net');
const process = require('ruptela');

const server = net.createServer((conn) => {
    const addr = `${conn.remoteAddress}:${conn.remotePort}`;
    console.log(`Nueva conexión desde ${addr}`);

    conn.on('data', (data) => {
        console.log(`Datos recibidos de ${addr}:`, data);
        const res = process(data);
        if (!res.error) {
            // Imprimir datos decodificados
            console.log('Datos decodificados:');
            console.dir(res.data, { depth: null, colors: true });

            // Enviar acuse de recibo
            conn.write(res.ack);
        } else {
            // Manejar el error
            console.error(`Error al procesar datos de ${addr}:`, res.error);
        }
    });

    conn.on('close', () => {
        console.log(`Conexión cerrada desde ${addr}`);
    });

    conn.on('error', (error) => {
        console.error(`Error en la conexión desde ${addr}:`, error.message);
    });
});

const PORT = 8989; // Puerto de escucha
server.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
