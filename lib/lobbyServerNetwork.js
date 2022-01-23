/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const ws=require('ws');

// eslint-disable-next-line no-unused-vars
const WebSocketServer=ws.WebSocketServer;

// TODO: change it to stack calling
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
    case 'undefined':
      return true;
    default:
      return true;
  };
};

function initLobbyServerNetwork(boundPort=9090) {
  const wss = new WebSocketServer({port: boundPort});
  const maxClientsPerIP = 10;
  const maxClientCommensPerSec = 3;
  // ip: String -> [websocket: WebSocket]
  const ip2clientsNum = {};
  wss.on('connection', function connection(ws, req) {
    // dos protecting
    if (req.socket.remoteAddress in ip2clientsNum) {
      if (ip2clientsNum[req.socket.remoteAddress]>=
        maxClientsPerIP) {
        ws.terminate(); // do not close, they could do slow loris attack and exhaust the file descriptors
      } else {
        ip2clientsNum[req.socket.remoteAddress]++;
      }
    } else {
      ip2clientsNum[req.socket.remoteAddress] = 1;
    }

    ws.timestamp = Date.now();
    ws.on('message', function incoming(message) {
      if (Date.now() != ws.timestamp) { // flooding protection
        ws.timestamp = Date.now();
        ws.commandCount = 0;
      } else {
        ws.commandCount++;
        if (ws.commandCount > maxClientCommensPerSec) {
          ws.terminate(); // do not close, they could do slow loris attack and exhaust the file descriptors
          console.log('client', req.socket.remoteAddress, 'is flooding; disconnecting');
        }
      }

      // if there is a message,
      // add this client to memory and let lobbyserver know
      const msgObj = JSON.parse(message);
      eventEmitter.emit('commandFromClient', ws,
          msgObj, wss.clients);
      //      if (sanityCheck(msgObj)) {
      //        eventEmitter.emit('commandFromClient', ws,
      //            JSON.parse(message), wss.clients);
      //      } else {
      //        // hackery, close connection
      //        ws.close();
      //      }
    });

    ws.on('close', function() {// make sure let lobby knows this client is gone at the network layer
      console.log('network closing');
      // console.log(ws);
      eventEmitter.emit('clearfromlobbymemory', ws);
    });

    ws.on('terminate', function() {// make sure let lobby knows this client is gone at the network layer
      eventEmitter.emit('clearfromlobbymemory', ws);
    });

    // append this socket to the ip
  });
}


module.exports= {
  initLobbyServerNetwork,
};
