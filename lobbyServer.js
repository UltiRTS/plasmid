/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {initLobbyServerNetwork} = require('./lib/lobbyServerNetwork');
// const ClientState = require('./clientState').default;
const {ClientState} = require('./state/client');
const {RoomState} = require('./state/room');

const {clearInterval} = require('timers');
// const eventEmitter = new EventEmitter()

class LobbyServer {
  chats = {};
  rooms = {};
  players = {}; // holds all connected clients;

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
                client.state = new ClientState({
                  username: message['parameters']['usr'],
                  accLevel: dbRet[1],
                });
                client.state.login();

                // console.log('client authenticated');
                client.connectivity = 10;
                client.respondedKeepAlive = true;
                client.keepAlive = server.processPing(client);

                server.players[client.state.username] = client;

                server.stateDump(client, 'LOGIN');
              }
            });
      } else if (message['action'] == 'LOGIN' &&
      !server.checkLoginClient(client, message)) {
        client.terminate();
      } else if ('state' in client && client.state.loggedIn) {
        // console.log('processing messages');
        server.processLoggedClient(client, message);
      } else if (message['action'] == 'REGISTER' &&
        server.checkRegClient(client, message)) {
        global.database.checkDup(message['parameters']).then((dup)=>{
          if (dup) {
            global.database.authenticate(message['parameters'])
                .then(function(dbRet) {
                  const isLoggedIn = dbRet[0];

                  if (isLoggedIn) {
                    client.state = new ClientState({
                      username: message['parameters']['usr'],
                      accLevel: dbRet[1],
                    });
                    client.state.login();

                    // console.log('client authenticated');
                    client.connectivity = 10;
                    client.respondedKeepAlive = true;
                    client.keepAlive = server.processPing(client);

                    server.players[client.state.username] = client;

                    server.stateDump(client, 'LOGIN');
                  }
                });
          } else {
            global.database.register(message['parameters'])
                .then(function(dbRet) {
                  if (dbRet[0]) {
                    client.state = new ClientState('testToken', {
                      username: message['parameters']['usr'],
                      accLevel: dbRet[1],
                    });
                    client.connectivity = 10;
                    client.respondedKeepAlive = true;
                    client.keepAlive = server.processPing(client);
                    client.state.login();
                    server.stateDump(client, 'REGISTER');
                  }
                });
          }
        });
      } else if (message['action'] == 'REGISTER' &&
      !server.checkRegClient(client, message)) {
        client.terminate();
      }
    });

    eventEmitter.on('disconnect', function(client) {
      // console.log('client disconnected');
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
    //    const isDupOK = !global.database.checkDup(message['parameters']);
    //    const isBanOK = true;
    //    if (isDupOK && isBanOK) {
    //      return true;
    //    }
    return true;
  }

  checkLoginClient(client, message) {
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
        // console.log(Object.keys(this.chats));

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
        let channelName;
        let chatMsg;
        try {
          channelName = message['parameters']['chatName'];
          chatMsg = message['parameters']['msg'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat message');
        }

        if (channelName in this.chats) {
          for (const ppl of this.chats[channelName]) {
            // now let everyone else know
            ppl.chatMsg = {'channelName': channelName, 'msg': chatMsg};
            this.stateDump(ppl, 'SAYCHAT');
            ppl.chatMsg = {'channelName': '', 'msg': ''};
            // TODO: add autohost msg relay
            // if (this.rooms.hasOwnProperty(channelName)) {
            //   const roomObj = this.rooms[channelName];
            //   autohostClient.autohostMgrSayBattle(roomObj, msg);
            // }
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
          // console.log('LEAVING CHAT', chatToLeave);
          // console.log(this.chats);
        } catch {
          // console.log('NU');
        } // hackery going on
        // remove this user from the chat's list of users
        client.state.leaveChat(chatToLeave);
        this.stateDump(client, 'LEAVECHAT');
        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'LEAVECHAT');
        }
        break;
      }
      case 'JOINGAME': { // join a game
        let battleToJoin;
        const username=client.state.username;
        try {
          battleToJoin = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'invalid battle name');
          console.log(e);
        }

        try {
          this.rooms[battleToJoin].setPlayer(username, 'A');
        } catch {
          this.rooms[battleToJoin]=new RoomState(client.state.username, 'Comet Catcher Redux', Object.keys(this.rooms).length);
        }
        client.state.joinRoom(battleToJoin);
        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
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
          this.clientSendNotice(client, 'error', 'leave game request incomplete');
        }

        try {
          this.rooms[battleToLeave].removePlayer(client.state.username);
        } catch (e) {
          this.clientSendNotice(client, 'error', 'leave game request unfulfilled');
          console.log(e);
          return;
        } // hackery going on
        client.state.leaveRoom(battleToLeave);
        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'LEAVEGAME');
        }
      }

      /* room related cmds, might require poll!*/

      case 'STARTGAME': { // set isStarted to true and let everyone else know
        let battleToStart;
        try {
          battleToStart = message['parameters']['battleName'];
        } catch (e) {
          // eslint-disable-next-line max-len
          this.clientSendNotice(client, 'error', 'invalid battle name to start');
        }

        // add this cmd to the poll if it's not in the poll
        this.rooms[battleToStart].addPoll(client.state.username, action);

        // if the poll is 50% or more, start the game
        if (this.rooms[battleToStart].getPollCount(action) >=
        this.rooms[battleToStart].getPlayerCount() ||
          client.state.username ==
          this.rooms[battleToStart].getHoster()) {
          try {
            autohostServer.start(this.rooms[battleToStart].configureToStart());
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          // this.stateDump(client, 'STARTGAME');
          this.clientSendNotice(client,
              'error',
              'not enough players to start game');
        }


        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'STARTGAME');
        }
        break;
      }

      case 'SETTEAM': { // set team
        let battleToSetTeam;
        let team;
        let AIs;
        try {
          battleToSetTeam = message['parameters']['battleName'];
          team = message['parameters']['team']; // {'tom':'A','bob':'A','alice':'B','xiaoming':'B'}
          AIs = message['parameters']['AIs'];
        } catch (e) {
          console.log(e);
          // eslint-disable-next-line max-len
          this.clientSendNotice(client, 'error', 'invalid battle name to set team');
        }

        // add this cmd to the poll if it's not in the poll
        this.rooms[battleToSetTeam].addPoll(client.state.username, action);

        if (this.rooms[battleToSetTeam].getPollCount(action) >=
        this.rooms[battleToSetTeam].getPlayerCount() ||
        client.state.username ==
        this.rooms[battleToSetTeam].getHoster()) {
          try {
            this.rooms[battleToSetTeam].clearPoll();

            const playerList = this.rooms[battleToSetTeam].getPlayerList();
            for (const ppl in playerList) { // GOING THROUGH A LIST OF REAL PLAYERS!!
              // check if team[ppl.state.username] is undefined
              if (team[ppl] == undefined) {
                this.clientSendNotice(client,
                    'info',
                    'The requested team does not cover all players in the room');
              } else {
                this.rooms[battleToSetTeam].setPlayer(ppl, team[ppl]);
                const singleClientInRoom = this.usernames2ClientObj([ppl])[0];
                singleClientInRoom.state.setTeam(team[ppl]);
              }
            }
            this.rooms[battleToSetTeam].setAIs(AIs);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          this.clientSendNotice(client,
              'error',
              'not enough players to set team');
        }


        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'SETTEAM');
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
          // eslint-disable-next-line max-len
          this.clientSendNotice(client, 'error', 'invalid battle name to set map');
        }

        // add this cmd to the poll if it's not in the poll
        this.rooms[battleToSetMap].addPoll(client.state.username, action);

        // if the poll is 50% or more, start the game
        if (this.rooms[battleToSetMap].getPollCount(action) >=
        this.rooms[battleToSetMap].getPlayerCount() ||
        client.state.username ==
        this.rooms[battleToSetMap].getHoster()) {
          try {
            this.rooms[battleToSetMap].clearPoll();
            this.rooms[battleToSetMap].setMap(mapToSet);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        }

        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'SETMAP');
        }
        break;
      }
      case 'EXITGAME': {// set isStarted to false and let everyone else know
        let battleToStop;
        try {
          battleToStop = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid battle name to exit');
        }
        // add this cmd to the poll if it's not in the poll
        this.rooms[battleToStop].addPoll(client.state.username, action);


        // if the poll is 50% or more, exit the game
        if (this.rooms[battleToStop].getPollCount(action) >=
        this.rooms[battleToStop].getPlayerCount() ||
        client.state.username ==
        this.rooms[battleToStop].getHoster()) {
          try {
            this.rooms[battleToStop].clearPoll();
            this.rooms[battleToStop].configureToStop();
            autohostServer.killEngine(this.rooms[battleToStop]);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          this.clientSendNotice(client,
              'error',
              'not enough players to stop game');
        }

        const playerList = this.rooms[battleToSetTeam].getPlayerList();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'EXITGAME');
        }
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
      'action': 'NOTICE', 'parameters': {'type': type, 'msg': msg},
    }));
  }

  usernames2ClientObj(usernames) {
    const clients = [];
    for (const username of usernames) {
      for (const player of this.players) {
        if (player.state.username == username) {
          clients.push(client);
        }
      }
    }
    return clients;
  }

  // must ensure that all references be deleted
  // or there will be memory leaks
  logOutClient(client) { // server inited disconnect
    // remove client from all chats
    for (const chat of client.joinedChats) {
      this.processLoggedClientCmd('LEAVECHAT', client, {'chatName': chat});
    }

    // remove client from all battles
    for (const battle of client.joinedBattles) {
      this.processLoggedClientCmd('LEAVEGAME', client, {
        'battleName': battle,
      });
    }

    clearInterval(client[token].keepAlive);

    delete this.players[client.state.username];
  }

  // set an event listener for client disconnect

  stateDump(ppl, triggeredBy = 'DefaultTrigger') {
    // TODO: should add a filter for messages delivering

    // get all games
    const games = this.getAllGames();
    // const games = this.rooms;

    // get all chats that have this user in them
    const chatMsg = ppl.chatMsg;

    // dump the poll as well if the person is in a game
    let poll = {};
    let team = {};
    let AIs = {};
    if (ppl.state.room != '') {
      poll = this.rooms[ppl.state.room].getPolls();
      team = this.rooms[ppl.state.room].getPlayerTeam();
      AIs = this.rooms[ppl.state.room].getAI();
    }

    const response = {
      'usrstats': ppl.state.getState(),
      'games': games,
      'chats': Object.keys(this.chats),
      'chatmsg': chatMsg,
      'poll': poll,
      'team': team,
      'AIs': AIs,
    };

    ppl.send(JSON.stringify({
      'action': 'stateDump',
      triggeredBy,
      'paramaters': response,
    }));
  }


  getAllGames() {
    const games = [];

    // eslint-disable-next-line guard-for-in
    for (const battle in this.rooms) {
      const players = this.rooms[battle].getPlayerList();
      games.push({
        'battleName': this.rooms[battle].getTitle(),
        'isStarted': this.rooms[battle].isStarted(),
        'players': players,
      });
    }
    return games;
  }
}

module.exports = {
  LobbyServer,
};
