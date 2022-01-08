/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const ws=require('ws');

// eslint-disable-next-line no-unused-vars
const WebSocketServer=ws.WebSocketServer;
function initLobbyServerNetwork(boundPort=9090) {
  const wss = new WebSocketServer({port: boundPort});
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
