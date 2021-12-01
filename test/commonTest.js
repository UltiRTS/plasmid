/* eslint-disable require-jsdoc */
const ws = require('ws');
const WebSocket = ws.WebSocket;

const registerJson = {
  action: 'REGISTER',
  parameters: {
    usr: 'test',
    passwd: 'testpassword',
  },
};

const loginJson = {
  action: 'LOGIN',
  parameters: {
    usr: 'test',
    passwd: 'testpassword',
  },
};

const socket = new WebSocket('ws://localhost:9090');
socket.on('open', function open() {
  socket.send(JSON.stringify(registerJson));
});

socket.on('message', (message) => {
  const response = filter(JSON.parse(message));

  console.log(response);
  if ('triggeredBy' in response) {
    switch (response.triggeredBy) {
      case 'REGISTER':
        socket.send(JSON.stringify(loginJson));
    }
  }
});

function filter(msg) {
  if ('action' in msg && msg.action === 'PING') {
    return {};
  }

  return msg;
}

