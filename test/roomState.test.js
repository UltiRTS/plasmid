const assert = require('assert');
const {RoomState} = require('../state/room');

describe('RoomStateIntegrity', () => {
  describe('all', () => {
    it('output should equals to set', () => {
      const roomState = new RoomState('testHoster');

      roomState.addAI('A');
      roomState.addAI('B');
      roomState.addPlayer('tom', 'A');
      roomState.addPlayer('teddy', 'B');
      roomState.addChicken('B');
      roomState.addChicken('C');
      roomState.addSpectator('spec1');
      roomState.setMap('somemap');

      // the following code is out of date!
      const engineLaunchObj = roomState.configureToStart();
      assert.equal(String(engineLaunchObj),
          String({
            map: 'somemap',
            testHoster0: {
              index: 0,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: true,
              team: 'A',
            },
            tom1: {
              index: 1,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: false,
              team: 'A',
            },
            teddy2: {
              index: 2,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: false,
              team: 'B',
            },
            CircuitAI3: {
              index: 3,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: false,
              team: 'A',
            },
            CircuitAI4: {
              index: 4,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: false,
              team: 'B',
            },
            Chicken5: {
              index: 5,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: false,
              team: 'B',
            },
            Chicken6: {
              index: 6,
              isAI: false,
              isChicken: false,
              isSpectator: false,
              isLeader: false,
              team: 'C',
            },
            spec17: {
              index: 7,
              isAI: false,
              isChicken: false,
              isSpectator: true,
              isLeader: false,
              team: 'A',
            },
          },
          ));
    });
  });
});

