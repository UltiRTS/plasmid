const ws = require('ws');
const WebSocket = ws.WebSocket;

/**
 * @class
 */
class AutohostManager {
  availables = [];
  /**
   *
   * @param {Array} availableServers
   */
  constructor(availableServers) {
    this.availables = availableServers;
  }


// TODO: need do a symmetric crypto test
//  queryStatus(address, port) {
//    const ws = new WebSocket(`ws://${address}:${port}`);
//  }
}


module.exports = AutohostManager;
