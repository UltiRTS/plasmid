/* eslint-disable require-jsdoc */

// eslint-disable-next-line max-len
const {initAutohostServerNetwork} = require('../lib/autohostServerNetwork');

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

    eventEmitter.on('connectionFromAutohost', function(clients) {
      server.clients=clients;
      // console.log(server.clients[0]);
    });
  }

  /**
   *
   * @param {object} roomObj
   */
  start(roomObj) {
    // console.log(Array.from(this.clients)[0]);
    const autohostNum=roomObj.mgr;
    // eslint-disable-next-line max-len
    try {
      Array.from(this.clients)[autohostNum].send(JSON.stringify(
          {'action': 'startGame', 'parameters': roomObj}));
    } catch (err) {
      console.log('no active autohost!');
    }
  }
}


module.exports = {
  AutohostManager,
};
