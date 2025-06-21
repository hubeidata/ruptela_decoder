export function setupWebSocket(wss) {
  const clients = new Map();
  wss.on('connection', (ws) => {
    clients.set(ws, { authenticated: false });
    ws.on('message', (message) => { /* ... */ });
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });
}