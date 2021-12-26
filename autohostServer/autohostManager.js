/* eslint-disable require-jsdoc */

// eslint-disable-next-line max-len
const {initAutohostServerNetwork} = require('../libnetwork/libautohostServerNetwork');

/**
 * @class AutohostManger
 * @description this class is for handling autohost client
 */
class AutohostManager {
  /**
   *
   * @param {Array} availableServers
   */
  constructor(availableServers) {
    server=this;
    initAutohostServerNetwork(availableServers);
    console.log(availableServers);
    eventEmitter.on('commandFromAutohost', function(client, message) {
      switch (message.action) {
        case 'sayChat':
          // eslint-disable-next-line max-len
          server.sayChat(message.parameters); // the parameters contain the author, the chat content and the target channel
        case 'exitGame':
          server.exitGame(message.parameters);
        case 'kickPlayer':
          server.kickPlayer(message.parameters);
        case 'giveUpandLose':
          server.giveUpandLose(message.parameters);
      }
    });

    eventEmitter.on('connectionFromAutohost', function(clients) {
      server.clients=clients;
    });
  }

  /**
   *
   * @param {object} roomObj
   */
  start(roomObj) {
    console.log(this.clients[0]);
    this.clients[this.loadBalance()].send(JSON.stringify(roomObj));
  }

  /**
   * @description function determine which server should be used
   * @return {Number}
   */
  loadBalance() {
    return 0;
  }
}


module.exports = AutohostManager;
