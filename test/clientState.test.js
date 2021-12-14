const assert = require('assert');

const {ClientState} = require('../lobbyServer/clientState');

describe('ClientState', function() {
  describe('#constructor()', function() {
    it('the username, token should equal to the input', function() {
      const options = {
        username: 'Chan',
        accLevel: 'administrator',
      };

      const state = new ClientState('token', options);
      assert.equal(state.username, options.username);
      assert.equal(state.accLevel, options.accLevel);
    });
  });

  describe('#joinChat()', function() {
    it('should add the chat to the client state', function() {
      const state = new ClientState('token', {
        username: 'Chan',
        accLevel: 'administrator',
      });

      state.joinChat('chat1');
      state.joinChat('chat2');
      state.joinChat('chat3');

      assert.equal(state.chats.length, 3);
      assert.equal(state.chats[0], 'chat1');
      assert.equal(state.chats[1], 'chat2');
      assert.equal(state.chats[2], 'chat3');
    });
  });

  describe('#leaveChat()', function() {
    it('should remove the chat from the client state', function() {
      const state = new ClientState('token', {
        username: 'Chan',
        accLevel: 'administrator',
      });

      state.joinChat('chat1');
      state.joinChat('chat2');
      state.joinChat('chat3');

      state.leaveChat('chat1');
      state.leaveChat('chat3');

      assert.equal(state.chats.length, 1);
      assert.equal(state.chats[0], 'chat2');
    });
  });

  describe('#joinRoom()', function() {
    it('should add the room to the client state', function() {
      const state = new ClientState('token', {
        username: 'Chan',
        accLevel: 'administrator',
      });

      state.joinRoom('room1');
      assert.equal(state.room, 'room1');
    });
  });

  describe('#joinTeam()', function() {
    it('only can join team after join room', function() {
      const state = new ClientState('token', {
        username: 'Chan',
        accLevel: 'administrator',
      });

      state.joinTeam('team1');
      assert.equal(state.team, '');

      state.joinRoom('room1');
      state.joinTeam('team1');
      assert.equal(state.team, 'team1');
    });
  });
});
