
/**
 * @class RoomState
 * @description for managing room
 */
class RoomState {
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
  /**
   *
   * @param {String} hoster room hoster
   */
  constructor(hoster='default') {
    this.hoster = hoster;
    this.players.push({[hoster]: 'A'});
  }

  /**
   *
   * @param {String} playerName
   * @param {String} team
   */
  addPlayer(playerName, team) {
    this.players.push({[playerName]: team});
  }

  /**
   *
   * @param {String} team
   */
  addAI(team) {
    this.AIs.push({CircuitAI: team});
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

  /**
   * @return {Object} for engine launch
   */
  enginize() {
    let count = 0;
    const engineLaunchObj = {};
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
