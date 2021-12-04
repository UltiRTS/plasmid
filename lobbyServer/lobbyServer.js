/* eslint-disable require-jsdoc */
const initLobbyServerNetwork = require('../libnetwork/liblobbyServerNetwork');
// const ClientState = require('./clientState').default;

const {ClientState} = require('./clientState');
const {clearInterval} = require('timers');
// const eventEmitter = new EventEmitter()

class LobbyServer {
  chats = [];

  constructor() {
    console.log('lobby server started!');
    initLobbyServerNetwork();
    const server = this;
    eventEmitter.on('commandFromClient', function(client, message) {
      if (message['action'] == 'LOGIN') {
        // console.log(client)
        global.database.authenticate(message['parameters'])
            .then(function(dbRet) {
              const isLoggedIn = dbRet[0];

              if (isLoggedIn) {
                client.state = new ClientState('testToken', {
                  username: message['parameters']['usr'],
                  accLevel: dbRet[1],
                });
                client.state.login();

                console.log('client authenticated');
                client.connectivity = 10;
                client.respondedKeepAlive = true;
                client.keepAlive = server.processPing(client);

                server.stateDump(client, 'LOGIN');
              }
            });
      } else if ('state' in client && client.state.loggedIn) {
        console.log('processing messages');
        server.processLoggedClient(client, message);
      } else if (message['action']=='REGISTER' &&
      server.checkRegClient(client, message)) {
        global.database.register(message['parameters'])
            .then(function(dbRet) {
              if (dbRet) {
                client.state = new ClientState('testToken', {
                  username: message['parameters']['usr'],
                  accLevel: dbRet[1],
                });
                client.connectivity = 10;
                client.respondedKeepAlive = true;
                client.keepAlive = server.processPing(client);

                server.stateDump(client, 'REGISTER');
              }
            });
      }
    });

    eventEmitter.on('disconnect', function(client) {
      console.log('client disconnected');
      server.logOutClient(client);
    });

    eventEmitter.on('commandFromAutohost', function() {
      // do something with autohost incoming interface msg
    });
  }

  checkRegClient(client, message) {
    // FIXME:
    // check if the same mac or ip address are
    // used to register multiple accounts,
    // check if the ip address is banned
    return true;
  }

  processLoggedClient(client, message) {
    const action = message['action'];

    // var username = client.username

    switch (action) {
      case 'PONG': {
        client.respondedKeepAlive = true;
      }


      case 'JOINCHAT': {
        let chatToJoin;
        try {
          chatToJoin = message['parameters']['chatName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat name');
        }

        if (!(chatToJoin in this.chats)) this.chats[chatToJoin] = [];
        console.log(Object.keys(this.chats));

        this.chats[chatToJoin].push(client);

        // now this user has joined chat
        // add this user to the chat's list of users
        client.state.joinChat(chatToJoin);
        for (const ppl of this.chats[chatToJoin]) {
          // now let everyone else know
          this.stateDump(ppl, 'JOINCHAT');
        }

        break;
      }
      case 'SAYCHAT': {
        let channelName; let chatMsg;
        try {
          channelName = message['parameters']['chatName'];
          chatMsg = message['parameters']['msg'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat message');
        }

        console.log('channel: ', channelName);
        console.log('chatMsg: ', chatMsg);
        console.log('channels:', Object.keys(this.chats));

        console.log(channelName in this.chats);

        if (channelName in this.chats) {
          for (const ppl of this.chats[channelName]) {
            // now let everyone else know
            ppl.chatMsg = {'channelName': channelName, 'msg': chatMsg};
            this.stateDump(ppl, 'SAYCHAT');
            ppl.chatMsg = {'channelName': '', 'msg': ''};
            if (this.rooms.hasOwnProperty(channelName)) {
              const roomObj=this.rooms[channelName];
              autohostClient.autohostMgrSayBattle(roomObj, msg);
            }
          }
        } else {
          this.stateDump(client, 'SAYCHAT');
        }

        break;
      }
      case 'LEAVECHAT': {
        let chatToLeave;
        try {
          chatToLeave = message['parameters']['chatName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat name');
        }

        try {
          this.chats[chatToLeave]
              .splice(this.chats[chatToLeave].indexOf(client), 1);
          console.log('LEAVING CHAT', chatToLeave);
          console.log(this.chats);
        } catch {
          console.log('NU');
        } // hackery going on
        // remove this user from the chat's list of users
        client.state.leaveChat(chatToLeave);
        for (const ppl of this.chats[chatToLeave]) {
          this.stateDump(ppl, 'LEAVECHAT');
        }
        break;
      }
      case 'JOINGAME': { // join a game
        let battleToJoin;
        try {
          battleToJoin = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'invalid battle name');
        }

        try {
          this.rooms[battleToJoin].clients.push(client);
          this.rooms[battleToJoin].numofPpl += 1;
        } catch {
          this.rooms[battleToJoin] = {
            'polls': {},
            'numofPpl': 1,
            'host': client,
            'clients': [client],
            'ID': this.rooms.length,
            'map': '',
            'mods': '',
            'password': '',
            'isStarted': false,
            // in the future this could be returned by a load balancing function
            'responsibleAutohost': 0,
          };
        }
        client.joinRoom(battleToJoin);
        for (const ppl of this.rooms[battleToJoin].clients) {
          // now let everyone else know
          this.stateDump(ppl, 'JOINGAME');
        }
        break;
      }
      case 'LEAVEGAME': { // leave a game
        let battleToLeave;

        try {
          battleToLeave = message['parameters']['battleName'];
        } catch (e) {
          this.stateDump(client, 'LEAVEGAME');
        }

        try {
          this.rooms[battleToLeave].clients
              .splice(this.rooms[battleToLeave].clients.indexOf(client), 1);
          this.rooms[battleToLeave].numofPpl--;
        } catch (e) {
          this.clientSendNotice(client, 'error', 'something went wrong');
          console.log(e);
          return;
        } // hackery going on
        client.leaveRoom(battleToLeave);
        for (const ppl of this.rooms[battleToLeave].clients) {
          this.stateDump(ppl, 'LEAVEGAME');
        }
      }

      /* room related cmds, might require poll!*/

      case 'STARTGAME': { // set isStarted to true and let everyone else know
        let battleToStart;
        try {
          battleToStart = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid battle name');
        }

        // add this cmd to the poll if it's not in the poll
        if (!this.rooms[battleToStart].polls.hasOwnProperty(action)) {
          this.rooms[battleToStart].polls[action] = [];
        }
        this.rooms[battleToStart].polls[action].push(client);

        // if the poll is 50% or more, start the game
        if (this.rooms[battleToStart].polls[action].length >=
          Math.floor(this.rooms[battleToStart].numofPpl / 2) ||
          client.state.username ==
          this.rooms[battleToStart].host.usrname) {
          try {
            this.rooms[battleToStart].isStarted = true;
            this.rooms[battleToStart].polls[action] = [];
            autohostClient.autohostMgrCreatRoom(this.rooms[battleToStart]);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          // this.stateDump(client, 'STARTGAME');
          this.clientSendNotice(client,
              'error',
              'not enough players to start game');
        }


        for (const ppl of this.rooms[battleToStart].clients) {
          this.stateDump(ppl, 'STARTGAME');
        }
        break;
      }

      case 'SETMAP': { // set the map
        let battleToSetMap;
        let mapToSet;
        try {
          battleToSetMap = message['parameters']['battleName'];
          mapToSet = message['parameters']['map'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid battle name');
        }

        // add this cmd to the poll if it's not in the poll
        if (!this.rooms[battleToSetMap].polls.hasOwnProperty(action)) {
          this.rooms[battleToSetMap].polls[action] = [];
        }
        this.rooms[battleToSetMap].polls[action].push(client);

        // if the poll is 50% or more, start the game
        if (this.rooms[battleToSetMap].polls[action].length >=
          Math.floor(this.rooms[battleToSetMap].numofPpl / 2) ||
          client.state.username ==
          this.rooms[battleToSetMap].host.usrname) {
          try {
            this.rooms[battleToSetMap].map = mapToSet;
            this.rooms[battleToSetMap].polls[action] = [];
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        }

        for (const ppl of this.rooms[battleToSetMap].clients) {
          this.stateDump(ppl, 'SETMAP');
        }
        break;
      }
      case 'EXITGAME': {// set isStarted to false and let everyone else know
        let battleToStop;
        try {
          battleToStop = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid battle name');
        }
        // add this cmd to the poll if it's not in the poll
        if (!this.rooms[battleToStop].polls.hasOwnProperty(action)) {
          this.rooms[battleToStop].polls[action] = [];
        }
        this.rooms[battleToStop].polls[action].push(client);

        // if the poll is 50% or more, exit the game
        if (
          this.rooms[battleToStop].polls[action].length >=
            Math.floor(this.rooms[battleToStop].numofPpl / 2) ||
          client.state.username==this.rooms[battleToStop].host.usrname) {
          try {
            this.rooms[battleToStop].isStarted = false;
            this.rooms[battleToStop].polls[action] = [];
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          this.clientSendNotice(client,
              'error',
              'not enough players to stop game');
        }

        for (const ppl of this.rooms[battleToStop].clients) {
          this.stateDump(ppl, 'EXITGAME');
        }

        autohostMgrKillEngine(this.rooms[battleToStop]);
      }
    }
  }

  processPing(client) {
    const server = this;
    function checkPing() {
      client.send(JSON.stringify({'action': 'PING'}));
      if (client.respondedKeepAlive) {
        client.connectivity--;
      } // deduct client hp if it hasnt responded the previous ping
      // this will be set true once the client responds
      client.respondedKeepAlive = false;
      if (client.connectivity <= 0) {
        client.emit('disconnect');
        server.logOutClient(client);
      }
    }
    return setInterval(checkPing, 30000);
  }


  clientSendNotice(client, type, msg) {
    client.send(JSON.stringify({
      'action': 'NOTICE', 'parameters': {'type': type, 'msg': msg}}));
  }

  logOutClient(client) { // server inited disconnect
    // remove client from all chats
    for (const chat of client.joinedChats) {
      this.processLoggedClientCmd('LEAVECHAT', client, {'chatName': chat});
    }

    // remove client from all battles
    for (const battle of client.joinedBattles) {
      this.processLoggedClientCmd('LEAVEGAME', client, {'battleName': battle});
    }

    clearInterval(client[token].keepAlive);
  }

  // set an event listener for client disconnect

  stateDump(ppl, triggeredBy='DefaultTrigger') {
    // get all games
    const games = this.getAllGames();

    // get all chats that have this user in them
    const chats = ppl.state.chats;
    const chatMsg = ppl.chatMsg;

    // cdump the poll as well if the person is in a game
    let poll = {};
    if (ppl.state.room != '') {
      poll = getRoomPoll(ppl.state.room);
    }

    const response = {'usrstats': ppl.state,
      'games': games,
      'chats': chats,
      'chatmsg': chatMsg,
      'poll': poll};

    ppl.send(JSON.stringify({
      'action': 'stateDump',
      triggeredBy,
      'paramaters': response}));
  }

  getAllGames() {
    const games = [];

    // eslint-disable-next-line guard-for-in
    for (const battle in this.rooms) {
      const players=getAllPlayers(this.rooms[battle]);
      games.push({
        'battleName': battle,
        'isStarted': this.rooms[battle].isStarted,
        'players': players});
    }
    return games;
  }

  getAllPlayers(room) {
    const players = [];
    for (const client of room.clients) {
      players.push(client.usrname);
    }
    return players;
  }

  getRoomPoll(battle) {
    const poll = {};
    // eslint-disable-next-line guard-for-in
    for (const action in this.rooms[battle].polls) {
      poll[action] =
       this.rooms[battle].polls[action].length/this.rooms[battle].numofPpl;
    }
    return poll;
  }
}

module.exports = LobbyServer;
