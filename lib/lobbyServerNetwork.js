/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const {WebSocketServer}=require('ws');

// false -> illegal
// true -> legal
function sanityCheck(obj) {
  const notAllowed = '<>';
  switch (typeof(obj)) {
    case 'function':
      return false;
      break;
    case 'object':
      if (obj === null) return true;
      const keys = Object.keys(obj);
      for (const key of keys) {
        // console.log(obj[key], sanityCheck(obj[key]));
        if (sanityCheck(obj[key]) === false) return false;
      }
      return true;
      break;
    case 'string':
      for (let i=0; i<obj.length; i++) {
        if (notAllowed.includes(obj[i])) return false;
      }
      return true;
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
  const maxClientCommensPerSec = 10;
  // ip: String -> [websocket: WebSocket]
  const ip2clientsNum = {};
  wss.on('connection', function connection(ws, req) {
    ws.on('close', function() {// make sure let lobby knows this client is gone at the network layer
      // console.log('network closing');
      ip2clientsNum[req.socket.remoteAddress]--;
      eventEmitter.emit('clearFromLobbyMemory', ws);
    });

    ws.on('terminate', function() {// make sure let lobby know this client is gone at the network layer
      ip2clientsNum[req.socket.remoteAddress]--;
      eventEmitter.emit('clearFromLobbyMemory', ws);
      
    });

    ws.on('disconnect', function() {// make sure let lobby know this client is gone at the network layer
      ip2clientsNum[req.socket.remoteAddress]--;
      eventEmitter.emit('clearFromLobbyMemory', ws);
    });

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

      try {
        let msgJson = JSON.parse(message);
        eventEmitter.emit('commandFromClient', ws, msgJson);
        console.log(msgJson);
      } catch (e) {
        console.log('invalid message, dropping');
      }

      // if there is a message,
      // add this client to memory and let lobbyserver know
      // let msgObj = "";
      // try{
      //   msgObj = JSON.parse(message);
      // }
      // catch{
      //   eventEmitter.emit('invalidDataFromClient', ws, String(message));
      // }
      
      // if (sanityCheck(msgObj)) {
      //   eventEmitter.emit('commandFromClient', ws,
      //       msgObj);
      // } else {
      //   eventEmitter.emit('invalidCommandFromClient', ws, msgObj);
      //   // hackery, close connection
      //    eventEmitter.emit('clearFromLobbyMemory', ws);
      //    ws.terminate();
      // }
    });
    // append this socket to the ip
  });
  
    
}


module.exports = {
  initLobbyServerNetwork,
  sanityCheck,
};
