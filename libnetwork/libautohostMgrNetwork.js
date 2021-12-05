const {msgSignKey} = require('../config.js');
const {decript, encrypt} = require('../libCrypto/libCrypto.js');

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

  /**
   *
   * @return {String} returns a random server location
   */
  rollServer() {
    return this.availables[Math.floor(Math.random() * this.availables.length)];
  }

  /**
   *
   * @param {String} server
   * @return {obejct} returns server status object
   * In format of
   * {
   *   ...
   *   availableRam: Number,
   *   gameHosted: Number,
   *   ...
   * }
   */
  queryServerStatus(server) {
    let result = null;
    fetch(`${server}/status`).then((res) => {
      res.json().then((json) => {
        result = res;
      });
    }).catch((err)=> {
      console.log(err);
    });

    return result;
  }

  /**
   *
   * @param {String} server
   * @param {object} gameData
   * @return {object} returns a json object of game host data
   */
  sendHostRequest(server, gameData) {
    const result = null;
    fetch(`${server}/host`, {
      method: 'POST',
      body: encrypt(JSON.stringify(gameData), msgSignKey),
    }).then((res)=> {
      res.json().then((json) => {
        result = res;
      });
    }).catch((err)=> {
      console.log(err);
    });

    return result;
  }

  /**
   *
   * @param {String} server
   * @param {Number} battleId
   * @return {object} returns a json object of battle info
   */
  queryBattleStatus(server, battleId) {
    const result = null;
    fetch(`${server}/battle/${battleId}`).then((res)=> {
      res.json().then((json) => {
        result = res;
      });
    }).catch((err)=>{
      console.log(err);
    });
    return result;
  }

  // eslint-disable-next-line require-jsdoc
  encryptMsg(msg) {
    return encrypt(msg, msgSignKey);
  }

  // eslint-disable-next-line require-jsdoc
  parseMsg(msg) {
    return decript(msg, msgSignKey);
  }
}


module.exports = AutohostManager;
