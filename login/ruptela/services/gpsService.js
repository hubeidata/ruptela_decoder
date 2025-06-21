import net from 'net';
import { parseRuptelaPacket } from '../controller/ruptela.js';
import { processAndEmitGpsData, saveRecord } from './gpsProcessing.js';

export function setupTcpServer(TCP_PORT) {
  const tcpServer = net.createServer({ keepAlive: true, allowHalfOpen: false }, (socket) => {
    socket.setKeepAlive(true, 60000);
    socket.on('data', async (data) => {
      try {
        socket.write(Buffer.from('0002640113BC', 'hex'));
        const hexData = data.toString('hex');
        const decodedData = parseRuptelaPacket(hexData);
        processAndEmitGpsData(decodedData);
        await saveRecord(decodedData);
      } catch (error) {
        console.error('Error procesando datos GPS:', error);
      }
    });
    socket.on('error', (err) => socket.destroy());
  });
  tcpServer.listen(TCP_PORT, () => console.log(`Servidor TCP en puerto ${TCP_PORT}`));
}