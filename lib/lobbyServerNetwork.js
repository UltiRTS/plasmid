/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const ws=require('ws');

// eslint-disable-next-line no-unused-vars
const WebSocketServer=ws.WebSocketServer;

function sanityCheck(obj) {
  const notAllowed = '!"#$%&\'()*+,-.\/:;<=>?@[\]^_`{|}~';
  switch (typeof(obj)) {
    case 'function':
      return false;
      break;
    case 'object':
      return sanityCheck(obj);
      break;
    case 'string':
      for (let i=0; i<obj.length; i++) {
        if (obj[i] in notAllowed) return false;
      }
      break;
    default:
      return true;
  };
};

function initLobbyServerNetwork(boundPort=9090) {
  const wss = new WebSocketServer({port: boundPort});
  const maxClientsPerIP = 10;
  const maxClientCommensPerSec = 100;
  // ip: String -> [websocket: WebSocket]
  const connectionsMapping = {};
  wss.on('connection', function connection(ws, req) {
    // flooding protection
    if (req.socket.remoteAddress in connectionsMapping) {
      if (connectionsMapping[req.socket.remoteAddress].length>=
        maxClientsPerIP) {
        // may cause memory leak
        connectionsMapping[req.socket.remoteAddress].shift().close();
      }
      connectionsMapping[req.socket.remoteAddress].push(ws);
    } else {
      connectionsMapping[req.socket.remoteAddress] = [ws];
    }
    ws.commandCount = 0;
    ws.timestamp = Date.now();
    // buggy here commented out
    // if (config.hostileIP.includes(ws.upgradeReq.connection.remoteAddress)) {
    //   ws.terminate();
    // }
    ws.on('message', function incoming(message) {
      if (Date.now() != ws.timestamp) {
        ws.timestamp = Date.now();
        ws.commandCount = 0;
      } else {
        if (ws.commandCount > maxClientCommensPerSec) ws.close();
        ws.commandCount++;
      }

      // if there is a message,
      // add this client to memory and let lobbyserver know
      const msgObj = JSON.parse(message);
      if (sanityCheck(msgObj)) {
        eventEmitter.emit('commandFromClient', ws,
            JSON.parse(message), wss.clients);
      } else {
        // hackery, close connection
        ws.close();
      }
    });

    ws.on('close', function() {
      eventEmitter.emit('clientDisconnected', ws);
      delete ws;
    });


    // append this socket to the ip
  });
}


module.exports= {
  initLobbyServerNetwork,
};
