/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const ws=require('ws');
const {config} = require('../config');
const WebSocketServer=ws.WebSocketServer;
function initLobbyServerNetwork() {
  const wss = new WebSocketServer({port: 9090});
  wss.on('connection', function connection(ws) {
    // buggy here commented out
    // if (config.hostileIP.includes(ws.upgradeReq.connection.remoteAddress)) {
    //   ws.terminate();
    // }
    ws.on('message', function incoming(message) {
      // if there is a message,
      // add this client to memory and let lobbyserver know

      eventEmitter.emit('commandFromClient', ws,
          JSON.parse(message), wss.clients);
    });

    ws.on('close', function() {
      eventEmitter.emit('clientDisconnected', ws);
    });


    // append this socket to the ip
  });
}


module.exports= {
  initLobbyServerNetwork,
};
