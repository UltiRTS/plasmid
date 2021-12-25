/* eslint-disable require-jsdoc */
const ws = require('ws');
const WebSocket = ws.WebSocket;

const registerJson = {
  action: 'REGISTER',
  parameters: {
    usr: 'test4',
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

const joinChatJson = {
  action: 'JOINCHAT',
  parameters: {
    chatName: 'test',
  },
};

const sayChatJson = {
  action: 'SAYCHAT',
  parameters: {
    chatName: 'test',
    msg: 'test message',
  },
};

const leaveChatJson = {
  action: 'LEAVECHAT',
  parameters: {
    chatName: 'test',
  },
};

const joinBattleJson = {
  action: 'JOINGAME',
  parameters: {
    battleName: 'testBattle',
  },
};

const setTeamJson = {
  action: 'SETTEAM',
  parameters: {
    battleName: 'testBattle',
    team: {'tom': 'A', 'bob': 'A', 'alice': 'B', 'xiaoming': 'B', 'test': 'C'},
    AIs: {'CircuitAI': 'A', 'CircuitAI': 'B', 'CircuitAI': 'C'},
  },
};

const startGameJson = {
  action: 'STARTGAME',
  parameters: {
    battleName: 'testBattle',
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
        break;
      case 'LOGIN':
        socket.send(JSON.stringify(joinChatJson));
        break;
      case 'JOINCHAT':
        socket.send(JSON.stringify(sayChatJson));
        break;
      case 'SAYCHAT':
        socket.send(JSON.stringify(leaveChatJson));
        break;
      case 'LEAVECHAT':
        socket.send(JSON.stringify(joinBattleJson));
        break;
      case 'JOINGAME':
        socket.send(JSON.stringify(setTeamJson));
        break;
      case 'SETTEAM':
        socket.send(JSON.stringify(startGameJson));
    }
  }
});

function filter(msg) {
  if ('action' in msg && msg.action === 'PING') {
    return {};
  }

  return msg;
}

