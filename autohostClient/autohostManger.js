const {msgSignKey} = require('../config.js');
const {decript, encrypt} = require('../libCrypto/libCrypto.js');
const {AutohostClient} = require('./autohostClient');

/**
 * @class AutohostManger
 * @description this class is for handling autohost client
 */
class AutohostManager {
  availables = {};
  /**
   *
   * @param {Array} availableServers
   */
  constructor(availableServers) {
    for (const addr of availableServers) {
      const autohostClient = new AutohostClient(addr);
      this.availables[addr] = autohostClient;
    }
  }

  /**
   *
   * @return {String} returns a random server location
   */
  rollServer() {
    const serverAddrs = Object.keys(this.availables);
    return serverAddrs[Math.floor(Math.random() * serverAddrs.length)];
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
  queryClientStatus(server) {
    return this.availables[server].status();
  }

  /**
   *
   * @param {String} server
   * @param {object} gameData
   * @return {object} returns a json object of game host data
   */
  sendHostRequest(server, gameData) {
    this.availables[server].excute('createBattle', gameData);
    return {};
  }

  /**
   *
   * @param {String} server
   * @param {Number} battleId
   * @return {object} returns a json object of battle info
   */
  queryBattleStatus(server, battleId) {
    return {};
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
