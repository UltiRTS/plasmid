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
    usr: 'test4',
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
    // plasmid will block this cuz only one player connected
    // team: [{'test4': 'A'}, {'tom': 'A'}, {'jerry': 'B'}],
    team: [{'test4': 'A'}],
    AIs: [{'CircuitAI': 'A'}, {'CircuitAI': 'B'}, {'CircuitAI': 'C'}],
    chickens: [{'chicken': 'A'}, {'chicken': 'B'}, {'chicken': 'C'}],
    spectators: [{'spec': 'A'}, {'spec': 'B'}, {'spec': 'C'}],
  },
};

const startGameJson = {
  action: 'STARTGAME',
  parameters: {
    battleName: 'testBattle',
  },
};

const leaveBattleJson = {
  action: 'LEAVEGAME',
  parameters: {
    battleName: 'testBattle',
  },
};

const addFreundJson = {
  action: 'ADDFREUND',
  parameters: {
    freund: 'test4',
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
        break;
      case 'STARTGAME':
        socket.send(JSON.stringify(leaveBattleJson));
        console.log('sending leaving btl');
        break;
      case 'LEAVEGAME':
        socket.send(JSON.stringify(addFreundJson));
        break;
    }
  }
});

function filter(msg) {
  if ('action' in msg && msg.action === 'PING') {
    return {};
  }

  return msg;
}

