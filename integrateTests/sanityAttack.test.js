const ws = require('ws');
const WebSocket = ws.WebSocket;

const illegal = {
  a: '!hello',
};
const socket = new WebSocket('ws://localhost:9090');
socket.on('open', () => {
  socket.send(JSON.stringify(illegal));
});
