/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const ws=require('ws');
const WebSocketServer=ws.WebSocketServer;
function initAutohostServerNetwork(permittedautohostIP) {
  const wss = new WebSocketServer({port: 8080});
  wss.on('connection', function connection(ws) {
    if (permittedautohostIP.includes(ws.upgradeReq.connection.remoteAddress)) {
      eventEmitter.emit('connectionFreomAutohost', wss.clients);
      ws.on('message', function incoming(message) {
      // eslint-disable-next-line max-len
        eventEmitter.emit('commandFromAutohost', ws,
            JSON.parse(message), wss.clients);
      });
    } else {
      ws.terminate();
    }

    ws.on('close', function() {
      eventEmitter.emit('autohostDisconnected', ws);
    });


    // append this socket to the ip
  });
}


module.exports= {
  initAutohostServerNetwork,
};
