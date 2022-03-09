/* eslint-disable require-jsdoc */
// import { WebSocketServer } from 'ws';
const ws=require('ws');
const WebSocketServer=ws.WebSocketServer;
function initAutohostServerNetwork(permittedautohostIP, selfIP) {
  const wss = new WebSocketServer({port: 5000});
  wss.on('connection', function connection(ws, req) {
    // buggy here commented out
    // eslint-disable-next-line max-len
    console.log('mgr'+req.socket.remoteAddress);
    console.log(permittedautohostIP);
    if (req.socket.remoteAddress.endsWith(permittedautohostIP)) {
      ws.ip=req.socket.remoteAddress;
      if (req.socket.remoteAddress.endsWith('127.0.0.1')) ws.ip=selfIP;
      eventEmitter.emit('connectionFromAutohost', wss.clients);
      console.log('got connection');
      ws.on('message', function incoming(message) {
      // eslint-disable-next-line max-len
        const msgObj = JSON.parse(message);
        eventEmitter.emit('commandFromAutohost', ws,
            msgObj, wss.clients);
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
