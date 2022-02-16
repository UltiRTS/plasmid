/* eslint-disable brace-style */
/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {initLobbyServerNetwork} = require('../lib/lobbyServerNetwork');
// const ClientState = require('./clientState').default;
const {ClientState} = require('../state/client');
const {RoomState} = require('../state/room');


const {clearInterval} = require('timers');
// const eventEmitter = new EventEmitter()

class LobbyServer {
  chats = {};
  rooms = {};
  players = {}; // holds all connected clients;

  constructor(port, dataManager) {
    this.dataManager = dataManager;
    // uncomment below for deving purposes
    const {knexConf} = require('../config');
    const {DataManager} = require('../lib/dataManager');
    this.dataManager = new DataManager(knexConf);

    console.log('lobby server started!');
    initLobbyServerNetwork(port);
    const server = this;
    eventEmitter.on('commandFromClient', async function(client, message) {
      // unlloged in, we log it in and check if the client agreed to the contract
      // when registering; if not, we reprompt the contract
      if (!sanityCheckClient()) return;
      if (message['action'] == 'LOGIN') {
        const username = message['parameters']['usr'];
        const password = message['parameters']['passwd'];
        server.dataManager.login(username, password).then((res) => {
          console.log('logining');
          server.dataManager.queryUser(username).then((user)=>{
            console.log(user);
            server.dataManager.regConfirmed(user.username).then((confirmed) => {
              if (! confirmed) {
                server.clientSendNotice(client, 'warning', 'account not confirmed'); // the client is established, but not logged in. It will only have access to limited commands
              } else if (res === 'verified') {
                client.state = new ClientState({
                  username,
                  accLevel: user.accessLevel,
                  id: user.id,
                });

                client.state.login();

                client.connectivity = 10;
                client.respondedKeepAlive = true;
                // client.keepAlive = server.processPing(client);

                server.players[client.state.username] = client;

                server.stateDump(client, 'LOGIN');
                console.log('logging in');
              }
            }).catch((err) => {throw (err);});
          }).catch((e)=>{
            throw e;
          });
        }).catch((e)=>{
          server.clientSendNotice(client, 'error', 'Wrong username or password');
        });
        // server.database.authenticate(message['parameters'])
        //    .then((dbRet)=>loginClientWithLimitsCheck(dbRet));
      }
      // logged in, we assume the client has received contract prompt during login, it
      // has to agree to it now to continue. Or, it may continue if it agreed to it previously
      // REMOVE: needs to implement in case LOGIN
      // else if ('state' in client && client.state.loggedIn) {
      //   const status = await server.database.checkBlocked(client.state.username);
      //   switch (status) {
      //     case 'no':
      //       server.processLoggedClient(client, message);
      //       break;
      //     case 'regConfirm':
      //       if (message['action'] == 'regConfirm') {
      //         server.database.confirmReg(client.state.username).then((dbRet) => {
      //           server.processLoggedClient(client, message);
      //         });
      //       } else {
      //         eventEmitter.emit('clearFromLobbyMemory', client);
      //       }
      //   }
      // }

      // unregistered, we register, then login with contract prompt
      else if (message['action'] == 'REGISTER') {
        const username = message['parameters']['usr'];
        const password = message['parameters']['passwd'];

        server.dataManager.register(username, password).then(async (res) => {
          console.log(res);
          if (res === 'registered') {
            const user = await server.dataManager.queryUser(username);
            // add confirmation
            await server.dataManager.addConfirmation(user.username, '', 'register', '');
            client.state = new ClientState({
              username,
              accLevel: user.accessLevel,
              id: user.id,
            });

            server.stateDump(client, 'REGISTER');
          } else {
            server.clientSendNotice(client, 'error', res);
          }
        }).catch((e)=>{
          console.log(e);
          server.clientSendNotice(client, 'error', 'Username already exists');
        });

        // const dup = await server.database.checkDup(username);
        // if (dup) {
        //  server.database.authenticate(message['parameters'])
        //      .then((dbRet)=>loginClientWithLimitsCheck(dbRet));
        // } else {
        //  server.database.register(message['parameters'])
        //      .then(function(dbRet) {
        //        loginClientWithLimitsCheck(dbRet);
        //      });
        // }
      } else if (client.state.loggedIn) {
        server.processLoggedClient(client, message);
      } else {
        eventEmitter.emit('clearFromLobbyMemory', client);
      }

      function sanityCheckClient() {
        return true;
      }
    });


    eventEmitter.on('clearFromLobbyMemory', function(client, reason) {
      console.log('logging out this client');
      if (reason === 'sanity') {
        server.dataManager.queryUser(client.state.username).then(async (user)=>{
          user.sanity--;
          await server.dataManager.setUser(user);
        }).catch((e)=>{
          console.log(e);
        });
      }
      server.logOutClient(client);
    });

    eventEmitter.on('commandFromAutohost', function() {
      // do something with autohost incoming interface msg
    });
  }


  async processLoggedClient(client, message) {
    const action = message['action'];

    switch (action) {
      case 'PONG': {
        client.respondedKeepAlive = true;
        client.connectivity=10;
        break;
      }
      case 'JOINCHAT': {
        if (!client.state.loggedIn) return;
        console.log('received joinchat req');
        let chatToJoin;
        try {
          chatToJoin = message['parameters']['chatName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat name');
        }

        if (!(chatToJoin in this.chats))
        {
          const chat = await this.dataManager.createChat(chatToJoin, 'chat', '', '');
          this.chats[chatToJoin] = {
            chat,
            clients: [],
          };
        }
        // console.log(Object.keys(this.chats));

        // if the client is not in that chat, push it
        console.log(this.chats[chatToJoin].clients);
        if (!(this.chats[chatToJoin].clients.includes(client.state.username)))
        {
          console.log('actually joining chat');
          this.chats[chatToJoin].clients.push(client.state.username);
          client.state.joinChat(chatToJoin);
        }


        const usersinchat = this.usernames2ClientObj(this.chats[chatToJoin].clients);
        for (const ppl of usersinchat) {
          // now let everyone else know
          this.stateDump(ppl, 'JOINCHAT');
        }

        break;
      }
      case 'SAYCHAT': {
        if (!client.state.loggedIn) return;
        let chatName;
        let chatMsg;
        try {
          chatName = message['parameters']['chatName'] || 'global';
          chatMsg = message['parameters']['msg'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat message');
        }
        if (chatMsg=='') return;
        // console.log(channelName);
        // console.log(this.chats);
        // console.log(this.chats[channelName].clients);
        if (chatName in this.chats && this.chats[chatName].clients.includes(client.state.username)) {
          // console.log('inserted message'+chatMsg);
          // console.log('chat id: '+this.chats[chatName].chat.id);
          // console.log('user id: '+client.state.id);

          await this.dataManager.insertMessage(this.chats[chatName].chat.id, client.state.id, chatMsg);


          const pplObjs=this.usernames2ClientObj(this.chats[chatName].clients);
          for (const ppl of pplObjs) {
            // now let everyone else know
            // console.log('sending chat to ' + ppl.state.username);
            ppl.state.writeChatMsg({
              'author': client.state.username,
              'msg': chatMsg,
              'chatName': chatName,
            });
            this.stateDump(ppl, 'SAYCHAT');
            // console.log(ppl.state.chatMsg);

            // console.log(ppl.state.chatMsg);
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
        if (!client.state.loggedIn) return;
        let chatToLeave;
        try {
          chatToLeave = message['parameters']['chatName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat name');
        }

        try {
          this.chats[chatToLeave].clients
              .splice(this.chats[chatToLeave].clients.indexOf(client), 1);
          // console.log('LEAVING CHAT', chatToLeave);
          // console.log(this.chats);
        } catch {
          // console.log('NU');
        } // hackery going on
        // remove this user from the chat's list of users
        client.state.leaveChat(chatToLeave);
        this.stateDump(client, 'LEAVECHAT');
        const pplObjs=this.usernames2ClientObj(this.chats[chatToLeave].clients);
        for (const ppl of pplObjs) {
          this.stateDump(ppl, 'LEAVECHAT');
        }
        break;
      }
      case 'JOINGAME': { // join a game
        if (!client.state.loggedIn) return;
        let battleToJoin;
        const username=client.state.username;
        try { // catch malformed request
          battleToJoin = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'invalid battle name');
          console.log(e);
        }

        // if already in a game, leave it
        if (client.state.room!=null) {
          this.rooms[client.state.getRoom()].removePlayer(client.state.username);
        }


        try { // catch new room
          this.rooms[battleToJoin].setPlayer(username, 'A');
        } catch {
          this.rooms[battleToJoin]=new RoomState(client.state.username, 'Comet Catcher Redux', Object.keys(this.rooms).length);
          this.rooms[battleToJoin].setRoomName(battleToJoin);
          const autohostIPNum=this.loadBalance();
          this.rooms[battleToJoin].setResponsibleAutohost(autohostIPNum);
        }
        client.state.joinRoom(battleToJoin);
        // const playerList = this.rooms[battleToJoin].getPlayers();
        for (const ppl in this.players) {
          // now let everyone else know
          this.stateDump(this.players[ppl], 'JOINGAME');
        }
        break;
      }
      case 'LEAVEGAME': { // leave a game
        if (!client.state.loggedIn) return;
        console.log('received leaving game req');
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
        const playerList = this.rooms[battleToLeave].getPlayers();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'LEAVEGAME');
        }

        // let the client that left know
        this.stateDump(client, 'LEAVEGAME');
      }
      case 'ADDFREUND': {
        if (!client.state.loggedIn) return;
        let freundtoadd;
        let username;
        try {
          freundtoadd = message['parameters']['freund'];
          username = client.state.username;
          const addRes = await this.dataManager.addFriend(username, freundtoadd);
          if (addRes === 'added') {
            await this.dataManager.addConfirmation(freundtoadd, username, 'friend', '');
          }
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid freund');
        } // hackery going on
        break;
      }

      case 'CONFIRMSYSMSG': {
        let confirmationId;
        let acceptOrNot = false;
        let username;
        try {
          confirmationId = message['parameters']['id'];
          acceptOrNot = message['parameters']['AcceptNum'];
          username = client.state.username;
          if (client.state.loggedIn) {
            if (acceptOrNot) {
              const res =
                await this.dataManager.confirm(username, confirmationId);
              if (res === 'yes') this.clientSendNotice(client, 'success', 'confirmed');
              else this.clientSendNotice(client, 'error', res);
            }
          }
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid confirmation');
        }
        break;
      }

      /* room related cmds, might require poll!*/
      case 'STARTGAME': { // set isStarted to true and let everyone else know
        if (!client.state.loggedIn) return;
        let battleToStart;
        try {
          battleToStart = message['parameters']['battleName'];
        } catch (e) {
          // eslint-disable-next-line max-len
          this.clientSendNotice(client, 'error', 'invalid battle name to start');
        }
        // check if rooms has this battle
        if (!this.rooms.hasOwnProperty(battleToStart)) {
          this.clientSendNotice(client, 'error', 'no such battle');
          return;
        }
        // add this cmd to the poll if it's not in the poll
        this.rooms[battleToStart].addPoll(client.state.username, action);

        // if the poll is 50% or more, start the game
        if (this.rooms[battleToStart].getPollCount(action) >=
        this.rooms[battleToStart].getPlayerCount() ||
          client.state.username ==
          this.rooms[battleToStart].getHoster()) {
          try {
            // this.rooms[battleToStart].id=this.rooms;
            console.log('sending command');
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


        const playerList = this.rooms[battleToStart].getPlayers();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'STARTGAME');
        }
        break;
      }
      case 'SETTEAM': { // set team
        if (!client.state.loggedIn) return;
        const battleToSetTeam = client.state.room;
        if (battleToSetTeam === null) return;
        let playerToSetTeam;
        let teamToSet;
        let isCircuit;
        let isChicken;
        let isSpec;
        try {
          playerToSetTeam = message['parameters'].player;
          teamToSet = message['parameters'].team;
          isCircuit = message['parameters'].isCircuit;
          isChicken = message['parameters'].isChicken;
          isSpec = message['parameters'].isSpec;
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
            if (teamToSet=='-1'&&isCircuit) {
              try {
                this.rooms[battleToSetTeam].removeAI(playerToSetTeam);
              }
              catch {
                console.log('such ai doesnt exist');
              }
            }
            else if (isCircuit) {
              console.log('setting circuit');
              try {
                this.rooms[battleToSetTeam].setAI(playerToSetTeam, teamToSet);}
              catch {}
            }

            if (teamToSet=='-1'&&isChicken) {
              try {
                this.rooms[battleToSetTeam].removeChicken(playerToSetTeam);
              }
              catch {
                console.log('such ai doesnt exist');
              }
            }
            else if (isChicken) {
              console.log('setting circuit');
              try {
                this.rooms[battleToSetTeam].setChicken(playerToSetTeam, teamToSet);}
              catch {}
            }
            if (!isCircuit&&!isChicken&&teamToSet=='-1') {
              try {
                this.rooms[battleToSetTeam].removePlayer(playerToSetTeam);
              }
              catch {
                console.log('such ppl doesnt exist');
              }
            }
            else if (!isCircuit&&!isChicken&&teamToSet!='-1') {
              try {
                this.rooms[battleToSetTeam].setPlayer(playerToSetTeam, teamToSet);}
              catch {}
            }
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          this.clientSendNotice(client,
              'error',
              'not enough players to set team');
        }


        const playerList = this.rooms[battleToSetTeam].getPlayers();
        const playerListObj= this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'SETTEAM');
        }

        break;
      }
      case 'SETMAP': { // set the map
        if (!client.state.loggedIn) return;
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
        if (!client.state.loggedIn) return;
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
      if (!client.respondedKeepAlive) {
        client.connectivity--;
      } // deduct client hp if it hasnt responded the previous ping
      // this will be set true once the client responds
      client.respondedKeepAlive = false;
      if (client.connectivity <= 0) {
        client.emit('clearFromLobbyMemory');
        server.logOutClient(client);
      }
    }
    return setInterval(checkPing, 1000);
  }


  clientSendNotice(client, type, msg) {
    client.send(JSON.stringify({
      'action': 'NOTICE', 'parameters': {'type': type, 'msg': msg},
    }));
  }

  usernames2ClientObj(usernames) {
    const clients = [];
    for (const username of usernames) {
      for (const recordedUsrname in this.players) {
        if (this.players[recordedUsrname].state.username == username) {
          clients.push(this.players[recordedUsrname]);
        }
      }
    }
    return clients;
  }

  // must ensure that all references be deleted
  // or there will be memory leaks
  logOutClient(client) { // server inited disconnect
    // console.log('removing hb'+client.keepAlive);
    if (!client.state)
    {
      return;
    }
    clearInterval(client.keepAlive);
    // remove client from all chats
    for (const chat of client.state.chats) {
      this.processLoggedClient(client, {'action ': 'LEAVECHAT', 'parameters': {'chatName': chat}});
    }


    // remove client from all battles
    this.processLoggedClient( client, {'action ': 'LEAVEBATTLE', 'parameters': {'battleName': client.state.battle}});


    client.close();
    delete this.players[client.state.username];
  }

  // set an event listener for client disconnect

  stateDump(ppl, triggeredBy = 'DefaultTrigger') {
    // TODO: should add a filter for messages delivering

    // get all games
    const games = this.getAllGames();

    // get chat index
    const chatIndex = this.getChatIndex();


    // dump the poll as well if the person is in a game
    this.dataManager.getConfirmation(ppl.state.username).then((confirmations) => {
      const response = {
        'games': games,
        'chatsIndex': chatIndex,
        'notifications': confirmations,
        'usrstats': ppl.state.getState(),
      };
      // console.log(ppl.state.getState());
      ppl.send(JSON.stringify({
        'action': 'stateDump',
        triggeredBy,
        'paramaters': response,
      }));
      ppl.state.eraseChatMsg();
    });
  }

  getChatIndex() {
    const chatDictToReturn={};
    for (const chatName in this.chats) {
      chatDictToReturn[chatName]={
        chatType: this.chats[chatName].chatType,
        chatDescription: this.chats[chatName].chatDescription,
        clients: this.chats[chatName].clients,
      };
    }
    return chatDictToReturn;
  }

  getAllGames() {
    const games = [];

    // eslint-disable-next-line guard-for-in
    for (const battle in this.rooms) {
      games.push({
        'polls': this.rooms[battle].getPolls(),
        'battleName': this.rooms[battle].getTitle(),
        'isStarted': this.rooms[battle].checkStarted(),
        'players': {'AIs': this.rooms[battle].ais, 'players': this.rooms[battle].players, 'chickens': this.rooms[battle].chickens},
        'map': this.rooms[battle].getMap(),
        'port': this.rooms[battle].getPort(),
        'ip': this.rooms[battle].getResponsibleAutohost(),
        'id': this.rooms[battle].getID(),
      });
    }
    return games;
  }

  /**
   * @description function determine which server should be used
   * @return {Number}
   */
  loadBalance() {
    return autohostServer.autohostIDtoIP(0);
  }
}

module.exports = {
  LobbyServer,
};
