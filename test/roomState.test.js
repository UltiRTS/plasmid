const assert = require('assert');
const {RoomState} = require('../state/room');

describe('RoomStateIntegrity', () => {
  const roomState = new RoomState('test', 'Comet Catcher Redux', 0, '');

  describe('addAI', ()=> {
    roomState.pushAIs([{'CircuitAI': 'A'},
      {'CircuitAI': 'B'}, {'CircuitAI': 'C'}]);
    it('AI should be equal', ()=>{
      assert.equal(roomState.AIs.length, 3);
      assert.equal(roomState.AIs[0].CircuitAI, 'A');
      assert.equal(roomState.AIs[1].CircuitAI, 'B');
      assert.equal(roomState.AIs[2].CircuitAI, 'C');
    });
  });
  describe('addChicken', ()=> {
    roomState.pushChickens([{'Chicken': 'A'},
      {'Chicken': 'B'}, {'Chicken': 'C'}]);
    it('Chicken should be equal', ()=>{
      assert.equal(roomState.chickens.length, 3);
      assert.equal(roomState.chickens[0].Chicken, 'A');
      assert.equal(roomState.chickens[1].Chicken, 'B');
      assert.equal(roomState.chickens[2].Chicken, 'C');
    });
  });
  describe('addPlayers', () => {
    roomState.pushPlayers([{'player1': 'A'},
      {'player2': 'B'}, {'player3': 'C'}]);
    it('Player should be equal', ()=>{
      assert.equal(roomState.players.length, 4);
      assert.equal(roomState.players[0].test, 'A');
      assert.equal(roomState.players[1].player1, 'A');
      assert.equal(roomState.players[2].player2, 'B');
      assert.equal(roomState.players[3].player3, 'C');
    });
  });
});

