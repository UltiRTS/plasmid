const {WebSocket} = require('ws');

const ws = new WebSocket('ws://localhost:10083');


const registerMsg = {
  action: 'register',
  parameters: {
    username: 'reflex',
    password: 'reflex',
    priv_level: 1,
    invite_token: 'token',
  }
}

const loginMsg = {
  action: 'login',
  parameters: {
    username: 'reflex',
    password: 'reflex',
  }
}

const getSettingMsg = {
  action: 'getSetting',
  parameters: {}
}

const setSettingMsg = {
  action: 'setSetting',
  parameters: {
    key: 'newkey',
    value: 'newvalue',
  }
}

ws.on('open', () => {
  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data, isBinary) => {
  const msg = JSON.parse(data);
  switch(msg.action) {
    case 'register': {
      ws.send(JSON.stringify(loginMsg));
    }
    case 'login': {
      ws.send(JSON.stringify(getSettingMsg));
    }
    case 'getSetting': {
      ws.send(JSON.stringify(setSettingMsg));
    }
  }
  console.log(msg);
});