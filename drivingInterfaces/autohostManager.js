/* eslint-disable require-jsdoc */

// eslint-disable-next-line max-len
const { initAutohostServerNetwork } = require('../lib/autohostServerNetwork');

/**
 * @class AutohostManger
 * @description this class is for handling autohost client
 */
class AutohostManager {
  /**
   *
   * @param {Array} allowedClients
   * @param {String} selfIP
   */
  constructor(allowedClients, selfIP) {
    const server = this;
    initAutohostServerNetwork(allowedClients, selfIP);


    eventEmitter.on('connectionFromAutohost', function (clients) {
      server.clients = clients; // a lit of autohost
      // console.log(clients);
    });
  }

  /**
   *
   * @param {object} roomObj
   */
  start(roomObj) {
    // console.log(Array.from(this.clients)[0]);
    const autohostIP = roomObj.mgr;
    // console.log(autohostNum);
    console.log('autohost starting game!');
    const autohosts = Array.from(this.clients);
    // eslint-disable-next-line max-len
    try {
      const autohost = this.autohostIPtoID(autohostIP);
      console.log(autohost);
      console.log(autohostIP);
      autohosts[autohost].send(JSON.stringify(
        { 'action': 'startGame', 'parameters': roomObj }));
    } catch (err) {
      console.log('no active autohost!');
      console.log(err);
    }
  }

  killEngine(roomObj) {
    const autohostIP = roomObj.responsibleAutohost;
    // console.log(autohostNum);
    console.log('autohost killing engine!');
    const autohosts = Array.from(this.clients);
    // eslint-disable-next-line max-len
    try {
      const autohost = this.autohostIPtoID(autohostIP);
      autohosts[autohost].send(JSON.stringify(
        { 'action': 'killEngine', 'parameters': roomObj }));
    } catch (err) {
      console.log('no active autohost!');
      console.log(err);
    }
  }

  returnRoom(roomObj) {
    const autohostIP = roomObj.responsibleAutohost;
    // console.log(autohostNum);
    console.log('autohost returning room!');
    const autohosts = Array.from(this.clients);
    // eslint-disable-next-line max-len
    try {
      const autohost = this.autohostIPtoID(autohostIP);
      autohosts[autohost].send(JSON.stringify(
        { 'action': 'returnRoom', 'parameters': roomObj }));
    } catch (err) {
      console.log('no active autohost!');
      console.log(err);
    }
  }


  autohostIPtoID(autohostIP) {
    const autohosts = Array.from(this.clients);
    // console.log(autohosts);
    for (const autohost in autohosts) {
      // console.log(autohosts[autohost]);
      if (autohosts[autohost].ip.endsWith(autohostIP)) {
        return autohost;
      }
    }
  }

  autohostIDtoIP(autohostID) {
    const autohosts = Array.from(this.clients);
    return autohosts[autohostID].ip;
  }

  midJoin(roomObj, parameters) {
    const autohostIP = roomObj.mgr;
    console.log('mid join');
    const autohosts = Array.from(this.clients);
    try {
      const autohost = this.autohostIPtoID(autohostIP);
      autohosts[autohost].send(JSON.stringify({
        action: 'midJoin',
        parameters: parameters,
      }));
    } catch (e) {
      console.log('no active autohost!');
      console.log(e);
    }
  }
}


module.exports = {
  AutohostManager,
};
