/* eslint-disable require-jsdoc */
wsmodule = require('ws');
const WebSocket = wsmodule.WebSocket;
// initAutohostMgrClientNetwork = require('../libnetwork/libautohostMgrNetwork')


function connect(addr) {
  return ws = new WebSocket('ws://'+addr);
}

module.exports=connect;
