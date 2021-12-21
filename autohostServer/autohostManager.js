
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
    const server=this;
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

    eventEmitter.on('connectionFreomAutohost', function(clients) {
      server.clients=clients;
    });
  }

  start(roomObj) {
    server.clients[loadBalance()].send(JSON.stringify(roomObj));
    return;
  }

  loadBalance() {
    return 0;
  }
}


module.exports = AutohostManager;
