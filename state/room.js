
/**
 * @class RoomState
 * @description for managing room
 */
class RoomState {
  tile='';
  hoster = '';
  map = 'somemap';
  // format [{'CircuitAI': 'A'}, ...]
  AIs = [];
  // format [{'Chicken': 'A'}, ...]
  chickens = [];
  // format [{'player1': 'A'}, ...]
  players = [];
  // format ['spectator1', ...]
  spectators = [];
  polls = {};
  ID=0;
  password='';
  isStarted=false;
  responsibleAutohost=0;

  /**
   *
   * @param {String} hoster room hoster
   * @param {String} map map name
   * @param {int} ID id for room
   * @param {String} password password for room
   */
  constructor(hoster='default', map='Comet Catcher Redux', ID=0, password='') {
    this.hoster = hoster;
    this.players.push({[hoster]: 'A'});
    this.map=map;
  }

  // set room title

  /**
   *
   * @param {String} roomName the name of the room
   */
  setRoomName(roomName) {
    this.title = roomName;
  }

  // get room title

  /**
   *
   * @return {String} title of the room
   */
  getTitle() {
    return this.title;
  }

  /**
   *
   * @return {bool} if room started
   */
  checkStarted() {
    return this.isStarted;
  }

  /**
   *
   * @param {String} playerName
   * @param {String} team
   */
  setPlayer(playerName, team) {
    // check if the player is already in the room
    if (this.isPlayerInRoom(playerName)) {
      // if the player is in the room, set the team
      // eslint-disable-next-line max-len
      this.players.find((player) => player[playerName] === team)[playerName] = team;
    } else {
      this.players.push({[playerName]: team});
    }
  }

  // check if the player is already in the room
  /**
   * @param {String} playerName
   * @return {boolean} true if the player is already in the room
   */
  isPlayerInRoom(playerName) {
    return this.players.some((player) => Object.keys(player)[0] === playerName);
  }

  // get player list
  /**
   * @return {Array} list of players
   *
   */
  getPlayers() {
    const playerList=[];
    for (const player of this.players) {
      playerList.push(Object.keys(player)[0]);
    }
    return playerList;
  }

  // set responsible autohost
  /**
   * @param {int} id of the autohost in the config
   */
  setResponsibleAutohost(id) {
    this.responsibleAutohost = id;
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

  // remove player
  /**
   *
   * @param {String} playerName to be removed
   */
  removePlayer(playerName) {
    // eslint-disable-next-line max-len
    const targetIndex = this.players.findIndex((player) => playerName in player);
    if (targetIndex !== undefined) this.players.splice(targetIndex, 1);
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


  /**
   *
   * @param {dict} team a dict of the AIs{Circuit1: 'A', Circuit2: 'B'}
   */
  setAI(team) {
    for (const AI of this.AIs) {
      this.AIs.push({CircuitAI: AI});
    }
  }

  // get AI dict

  /**
   * @return {dict} ai dict
   */
  getAI() {
    const returningAI=[];
    for (const AI of this.AIs) {
      for (const AIname of AI) {
        returningAI.push(AIname);
      }
    }
    return returningAI;
  }

  /**
   *
   * @param {String} team
   */
  addChicken(team) {
    this.chickens.push({Chicken: team});
  }

  /**
   *
   * @param {String} spectatorName
   */
  addSpectator(spectatorName) {
    this.spectators.push(spectatorName);
  }

  /**
   *
   * @param {String} mapName
   */
  setMap(mapName) {
    this.map = mapName;
  }

  // get number of players
  /**
   * @return {int} number of players
   */
  getPlayerCount() {
    return this.players.length;
  }

  /**
   *
   * @return {dict} a dict of player teams
   */
  getPlayerTeam() {
    const returningDict={};
    for (const player of this.players) {
      returningDict[Object.keys(player)[0]]=Object.values(player)[0];
    }
    return returningDict;
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

    let count = 0;

    const engineLaunchObj = {};
    engineLaunchObj['id']=this.ID;
    engineLaunchObj['mgr']=this.responsibleAutohost;
    engineLaunchObj['map'] = this.map;

    for (const player of this.players) {
      const playerName = Object.keys(player)[0];
      if (playerName === 'CircuitAI' || playerName === 'Chicken') continue;

      const playerId = playerName + count;
      engineLaunchObj[playerId] = {
        index: count,
        isAI: false,
        isChicken: false,
        isSpectator: false,
        isLeader: playerName == this.hoster,
        team: player[playerName],
      };
      count++;
    }

    for (const AI of this.AIs) {
      const AIName = Object.keys(AI)[0];
      if (AIName !== 'CircuitAI') continue;

      const AIId = AIName + count;
      engineLaunchObj[AIId] = {
        index: count,
        isAI: false,
        isChicken: false,
        isSpectator: false,
        isLeader: false,
        team: AI[AIName],
      };
      count++;
    }

    for (const Chicken of this.chickens) {
      const ChickenName = Object.keys(Chicken)[0];
      if (ChickenName !== 'Chicken') continue;

      const ChickenId = ChickenName + count;
      engineLaunchObj[ChickenId] = {
        index: count,
        isAI: false,
        isChicken: false,
        isSpectator: false,
        isLeader: false,
        team: Chicken[ChickenName],
      };
      count++;
    }

    for (const spectator of this.spectators) {
      const spectatorId = spectator + count;
      engineLaunchObj[spectatorId] = {
        index: count,
        isAI: false,
        isChicken: false,
        isSpectator: true,
        isLeader: false,
        team: 'A',
      };
      count++;
    }

    return engineLaunchObj;
  }
}

module.exports = {
  RoomState,
};
