const {WebSocket} = require('ws');
const {encrypt, decript} = require('./libCrypto/libCrypto');
/**
 * @class AutohostClient
 */
class AutohostClient {
  allowedActions = [
    'createBattle',
    'messageRelay',
  ];

  /**
   *
   * @param {String} addr
   * @param {AutohostManager} manager
   */
  constructor(addr, manager) {
    this.manager = manager;
    this.addr = addr;
    this.ws = new WebSocket(addr);
    this.ws.on('open', () => {
      console.log('->Autohost Client Connected to: ' + addr);
    });

    this.ws.on('message', (message) => {
      this.onMessage(message);
    });

    this.ws.on('close', () => {
      console.log('->Autohost Client Disconnected from: ' + addr);
    });

    this.ws.on('error', (err) => {
      console.log(err);
    });
  }

  /**
   *
   * @param {String} message
   */
  onMessage(message) {
    const msg = JSON.parse(decript(message, msgSignKey));
    if ('action' in msg) {
      switch (msg.action) {
        case 'battleCreated':
          break;
        default:
          console.log(msg);
          break;
      }
    } else {
      console.log(msg);
    }
  }

  /**
   *
   * @return {Number}
   */
  status() {
    return this.ws.readyState;
  }

  /**
   *
   * @param {String} action
   * @param {object} data
   */
  excute(action, data) {
    if (!(action in this.allowedActions)) return;

    this.ws.send(encrypt(JSON.stringify({
      action,
      data,
    })));
  }
}

module.exports = {
  AutohostClient,
};
