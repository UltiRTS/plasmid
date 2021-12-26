/* eslint-disable require-jsdoc */
const ws = require('ws');
const WebSocket = ws.WebSocket;

const sayChatJson = {
  action: 'sayChat',
  parameters: {
    usr: 'test4',
    channel: 'testpassword',
    msg: 'test',
  },
};

const exitGameJson = {
  action: 'exitGame',
  parameters: {
    usr: 'test4',
    game: 'test',
  },
};

const kickPlayerJson = {
  action: 'kickPlayer',
  parameters: {
    usr: 'test4',
    game: 'test',
  },
};

const giveUpandLoseJson = {
  action: 'giveUpandLose',
  parameters: {
    usr: 'test4',
    game: 'test',
  },
};


const socket = new WebSocket('ws://localhost:8080');
socket.on('open', function open() {
  console.log('faking an autohost connected to plasmid');
  // socket.send(JSON.stringify(registerJson));
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
    }
  }
});

