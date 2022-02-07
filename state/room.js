/* eslint-disable guard-for-in */
/* eslint-disable require-jsdoc */

/**
 * @class RoomState
 * @description for managing room
 */
class RoomState {
  tile='';
  hoster = '';
  map = 'somemap';
  ais={}; // {'circuirAI':{'team':'A'}}
  chickens={};
  players={}; // format: {'xiaoming':{'isSpec':true,'team':'A','hasmap':true}}
  polls = {};
  id=0;
  password='';
  isStarted=false;
  responsibleAutohost='127.0.0.1';

  /**
   *
   * @param {String} hoster room hoster
   * @param {String} map map name
   * @param {int} ID id for room
   * @param {String} password password for room
   */
  constructor(hoster='default', map='Comet Catcher Redux', ID=0, password='') {
    this.hoster = hoster;
    this.players[hoster]={'isSpec': false, 'team': 'A', 'hasmap': true};
    this.map=map;
    this.id=ID;
    this.password=password;
  }

  setPlayer(playerName, team, isSpec=false, hasmap=true) {
    this.players[playerName]={'team': team, 'isSpec': isSpec, 'hasmap': hasmap};
  }

  // return a list of players
  getPlayers() {
    return Object.keys(this.players);
  }

  removePlayer(playerName) {
    delete this.players[playerName];
  }

  setAI(aiName, team) {
    this.ais[aiName]={'team': team};
  }
  setChicken(chickenName, team) {
    this.chickens[chickenName]={'team': team};
  }
  checkStarted() {
    return this.isStarted;
  }

  removeAI(aiName) {
    delete this.ais[aiName];
  }

  removeChicken(chickenName) {
    delete this.chickens[chickenName];
  }

  setPlayerMapStatus(playerName, hasMap) {
    this.players[playerName].hasmap=hasMap;
  }

  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  // set room title

  /**
   *
   * @param {String} roomName the name of the room
   */
  setRoomName(roomName) {
    this.title = roomName;
  }

  getPort() {
    return this.id+2000;
  }

  /**
   *
   * @return {String} title of the room
   */
  getTitle() {
    return this.title;
  }


  getID() {
    return this.id;
  }


  // set responsible autohost
  /**
   * @param {int} ip of the autohost in the config
   */
  setResponsibleAutohost(ip) {
    this.responsibleAutohost = ip;
  }

  // get responsible autohost
  /**
   *
   * @return {int} id of the autohost in the config
   */
  getResponsibleAutohost() {
    return this.responsibleAutohost;
  }

  /**
   *
   * @param {String} playerName name of player
   * @param {String} actionName name of the poll
   */
  addPoll(playerName, actionName) {
    if (!this.polls.hasOwnProperty(actionName)) {
      this.polls[actionName] = new Set();
    }
    this.polls[actionName].add(playerName);
  }

  // get poll count
  /**
   * @return {int} number of polls
   * @param {String} actionName
   */
  getPollCount(actionName) {
    if (!this.polls.hasOwnProperty(actionName)) {
      return 0;
    }
    return this.polls[actionName].size;
  }

  // return a dict with the name of the polls and the number of players
  /**
   * @return {dict} dict of the polls and the number of players
   */
  getPolls() {
    const returningPoll={};
    // eslint-disable-next-line guard-for-in
    for (const poll in this.polls) {
      returningPoll[poll]=this.polls[poll].size;
    }
    return returningPoll;
  }

  // clear poll
  /**
   * @param {String} actionName clears the player names under this action
   */
  clearPoll(actionName) {
    if (this.polls.hasOwnProperty(actionName)) {
      this.polls[actionName].clear();
    }
  }

  /**
   *
   * @param {String} passwd
   */
  setPasswd(passwd) {
    this.password=passwd;
  }

  // get hoster
  /**
 *
 * @return {string} host username.
 */
  getHoster() {
    return this.hoster;
  }

  getMap() {
    return this.map;
  }


  /**
   *
   * @param {String} mapName
   */
  setMap(mapName) {
    this.map = mapName;
  }

  /**
   * sets the room to stop
   */
  configureToStop() {
    this.isStarted=false;
    this.poll={};
  }

  /**
   * @return {Object} for engine launch
   */
  configureToStart() {
    this.isStarted=true;
    this.poll={};

    const engineLaunchObj = {};
    engineLaunchObj['id']=this.ID;
    engineLaunchObj['mgr']=this.responsibleAutohost;
    engineLaunchObj['map'] = this.map;
    engineLaunchObj['team']={};

    const teamMapping = {};
    let teamCount = 0;

    // the below discoveres new letters and assign those with a number
    for (const player in this.players) {
      const team = this.players[player].team;
      if (!(team in teamMapping)) {
        teamMapping[team] = teamCount;
        teamCount++;
      }
    }

    for (const player in this.ais) {
      const team = this.ais[player].team;
      if (!(team in teamMapping)) {
        teamMapping[team] = teamCount;
        teamCount++;
      }
    }

    for (const player in this.chickens) {
      const team = this.chickens[player].team;
      if (!(team in teamMapping)) {
        teamMapping[team] = teamCount;
        teamCount++;
      }
    }

    let count = 0;
    // the below handles players including spectators
    for (const player in this.players) {
      const playerName = player;
      let team;
      if (this.players[player].isSpec) {
        team = 0;
      } else {
        team = teamMapping[this.players[player].team];
      }

      engineLaunchObj.team[playerName] = {
        index: count,
        isAI: false,
        isChicken: false,
        isSpectator: this.players[player].isSpec,
        isLeader: playerName == this.hoster,
        team: team,
      };
      count++;
    }
    // the below handles AI configs
    for (const AI in this.ais) {
      const AIName = AI;

      const AIId = AIName + count;
      engineLaunchObj.team[AIId] = {
        index: count,
        isAI: true,
        isChicken: false,
        isSpectator: false,
        isLeader: false,
        team: teamMapping[this.ais[ai].team],
      };
      count++;
    }

    for (const chicken in this.chickens) {
      const chickenName = chicken;
      const chickenId = chickenName + count;
      engineLaunchObj.team[chickenId] = {
        index: count,
        isAI: false,
        isChicken: true,
        isSpectator: false,
        isLeader: false,
        team: teamMapping[this.chickens[chicken].team],
      };
      count++;
    }

    return engineLaunchObj;
  }
}

module.exports = {
  RoomState,
};
