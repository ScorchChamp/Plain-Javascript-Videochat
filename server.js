const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 7001 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    // Forward the message to the other client
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
});