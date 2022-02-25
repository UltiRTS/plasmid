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
  constructor(allowedClients) {
    const server=this;
    initAutohostServerNetwork(allowedClients);


    eventEmitter.on('connectionFromAutohost', function(clients) {
      server.clients=clients; // a lit of autohost
      // console.log(clients);
    });
  }

  /**
   *
   * @param {object} roomObj
   */
  start(roomObj) {
    // console.log(Array.from(this.clients)[0]);
    const autohostIP=roomObj.mgr;
    console.log(autohostNum);
    console.log('autohost starting game!');
    // eslint-disable-next-line max-len
    try {
      const autohost = autohostIPtoID(autohostIP);
      this.clients[autohost].send(JSON.stringify(
          {'action': 'startGame', 'parameters': roomObj}));
    } catch (err) {
      console.log('no active autohost!');
    }
  }

  killEngine(roomObj) {
    const autohostIP=roomObj.mgr;
    console.log(autohostNum);
    console.log('autohost killing engine!');
    // eslint-disable-next-line max-len
    try {
      const autohost = autohostIPtoID(autohostIP);
      this.clients[autohost].send(JSON.stringify(
          {'action': 'killEngine', 'parameters': roomObj}));
    } catch (err) {
      console.log('no active autohost!');
    }
  }


  autohostIPtoID(autohostIP) {
    for (autohosts in this.clients) {
      if (this.clients[autohosts].ip === autohostIP) {
        return autohosts;
      }
    }
  }
}


module.exports = {
  AutohostManager,
};
