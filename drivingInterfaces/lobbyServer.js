/* eslint-disable brace-style */
/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const { initLobbyServerNetwork } = require('../lib/lobbyServerNetwork');
// const ClientState = require('./clientState').default;
const { ClientState } = require('../state/client');
const { RoomState } = require('../state/room');


const { clearInterval } = require('timers');
// const {AutohostManager} = require('./autohostManager');
// const eventEmitter = new EventEmitter()

class LobbyServer {
  rooms = {};
  players = {}; // holds all connected clients;

  constructor(port, dataManager, autohostManager, chatsObj) {
    this.dataManager = dataManager;
    this.autohostManger = autohostManager;
    this.chats = chatsObj;

    console.log('lobby server started!');
    initLobbyServerNetwork(port);
    const server = this;
    eventEmitter.on('commandFromClient', async function (client, message) {
      // unlloged in, we log it in and check if the client agreed to the contract
      // when registering; if not, we reprompt the contract
      if (!sanityCheckClient()) return;
      if (message['action'] == 'LOGIN') {
        if(!(message['parameters']['usr'] && message['parameters']['passwd'])) return;
        const username = message['parameters']['usr'];
        const password = message['parameters']['passwd'];
        if (server.players[username]) {
          server.clientSendNotice(client, 'error', 'Username already exists');
          return;
        }
        server.dataManager.login(username, password).then((res) => {
          if(!res)
            return
          server.dataManager.queryUser(username).then((user) => {
            server.dataManager.regConfirmed(user.username).then(async (confirmed) => {
              if (!confirmed) {
                server.clientSendNotice(client, 'warning', 'account not confirmed'); // the client is established, but not logged in. It will only have access to limited commands
              } else if (res === 'verified') {
                const freundslist = await server.dataManager.getFriends(username);
                const notifications = await server.dataManager.getConfirmation(username);
                client.state = new ClientState({
                  username,
                  accLevel: user.accessLevel,
                  id: user.id,
                  freunds: freundslist,
                  notifications: notifications,
                });

                try {
                  client.state.freunds = await server.dataManager.getFriends(username);
                } catch (e) {
                  server.clientSendNotice(client, 'error', 'could not get friends');
                }
                try {
                  client.notifications = await server.dataManager.getConfirmation(username);
                } catch (e) {
                  server.clientSendNotice(client, 'error', 'could not get notifications');
                }

                client.state.login();

                client.connectivity = 10;
                client.respondedKeepAlive = true;
                client.keepAlive = server.processPing(client);

                server.players[client.state.username] = client;

                server.stateDump(client, 'LOGIN');
                console.log('logging in');
              }
            }).catch((err) => { throw (err); });
          }).catch((e) => {
            throw e;
          });
        }).catch((e) => {
          server.clientSendNotice(client, 'error', 'Wrong username or password');
        });
      }

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
        }).catch((e) => {
          server.clientSendNotice(client, 'error', 'Username already exists');
          console.log(e);
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


    eventEmitter.on('clearFromLobbyMemory', function (client) {
      try {
        console.log('logging out this client', client.state.username);
      }
      catch {
        console.log('logging out unlogged in client');
      }
      server.logOutClient(client);
    });

    eventEmitter.on('commandFromAutohost', function (client, message) {
      // do something with autohost incoming interface msg
      // const roomID = message.parameters.roomID;
      // message=JSON.parse(message);
      server.processAutohost(message.action, message.parameters);
    });
  }

  processAutohost(action, parameters) {
    console.log(action);
    console.log(parameters);
    const roomTitle = parameters['title'];
    let playerList;
    let playerListObj;
    switch (action) {
      case 'serverStarted':
        playerList = this.rooms[roomTitle].isStarted = true;
        playerList = this.rooms[roomTitle].getPlayers();
        playerListObj = this.usernames2ClientObj(playerList);
        console.log(playerListObj);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'STARTGAME');
        }
        // console.log('informing lobbies for game start!!!!!!!')
        break;
      case 'serverEnding':
        playerList = this.rooms[roomTitle].getPlayers();
        playerListObj = this.usernames2ClientObj(playerList);
        this.rooms[roomTitle].clearPoll();;
        this.rooms[roomTitle].configureToStop();
        autohostServer.returnRoom(this.rooms[roomTitle]);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'EXITGAME');
        }
        break;
    }
  }


  processLoggedClient(client, message) {
    const action = message['action'];
    const reqId = message['reqId'];
    console.log('process logged in triggered!');
    console.log(message);
    console.log('action:', action);
    switch (action) {
      case 'PONG': {
        client.respondedKeepAlive = true;
        client.connectivity = 10;
        break;
      }
      case 'JOINCHAT': {
        if (!client.state.loggedIn) return;
        // console.log('received joinchat req');
        let chatToJoin;
        try {
          chatToJoin = message['parameters']['chatName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat name');
        }

        if (!(chatToJoin in this.chats.chats)) {
          const chats = this.chats;
          const server = this;
          this.dataManager.createChat(chatToJoin, 'chat', '', '').then((chat) => {
            // console.log(chat)
            // console.log('new chat created')
            chats.createNewChat(chatToJoin, chat.id, chat.type, chat.describe, chat.password);
            if (!(chats.chats[chatToJoin].allMembers.includes(client.state.username))) {
              // console.log('actually joining chat');
              chats.chatMemberJoinChat(chatToJoin, client.state.username);
            }
            client.state.joinChat(chatToJoin);
            const usersinchat = server.usernames2ClientObj(chats.chats[chatToJoin].allMembers);
            for (const ppl of usersinchat) {
              // now let everyone else know
              server.stateDump(ppl, 'JOINCHAT', reqId);
            }
          });
        } else {
          this.chats.chatMemberJoinChat(chatToJoin, client.state.username);

          client.state.joinChat(chatToJoin);
          const usersinchat = this.usernames2ClientObj(this.chats.chats[chatToJoin].allMembers);
          for (const ppl of usersinchat) {
            // now let everyone else know
            this.stateDump(ppl, 'JOINCHAT', reqId);
          }
        }

        break;
      }
      case 'SAYCHAT': {
        if (!client.state.loggedIn) return;
        let chatName;
        let chatMsg;
        let noBridge;
        try {
          chatName = message['parameters']['chatName'] || 'global';
          chatMsg = message['parameters']['msg'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat message');
        }
        if (chatMsg == '') return;
        if (chatName in this.chats.chats && this.chats.chats[chatName].allMembers.includes(client.state.username)) {

          // console.log('client id: ', client.state.userID);
          const server = this;
          console.log(this.chats.chats[chatName].id);
          this.dataManager.insertMessage(this.chats.chats[chatName].id, client.state.userID, chatMsg).then(() => {
            const pplObjs = server.usernames2ClientObj(server.chats.chats[chatName].allMembers);
            for (const ppl of pplObjs) {
              // now let everyone else know
              // the line below is used for plasmid statedump
              ppl.state.writeChatMsg({
                'author': client.state.username,
                'msg': chatMsg,
                'chatName': chatName,
              });
              server.stateDump(ppl, 'SAYCHAT', reqId);

              /*his.chats.channelWriteLastMessage(chatName, chatMsg);*/
              eventEmitter.emit('bridgeMessage', { 'action': 'plasmidLobbyMsg', 'parameters': { 'sender': client.state.username, 'msg': chatMsg } });
            }
          });
        } else {
          this.stateDump(client, 'SAYCHAT', reqId);
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
          this.chats.chatMemberLeaveChat(chatToLeave, client.state.username);
          client.state.leaveChat(chatToLeave);
          this.stateDump(client, 'LEAVECHAT', reqId);
          const pplObjs = this.usernames2ClientObj(this.chats.chats[chatToLeave].allMembers);
          for (const ppl of pplObjs) {
            this.stateDump(ppl, 'LEAVECHAT', reqId);
          }
        } catch (e) {
          console.log(e);
        } // hackery going on
        // remove this user from the chat's list of users

        break;
      }


      case 'JOINGAME': { // join a game
        if (!client.state.loggedIn) return;
        let battleToJoin;
        const username = client.state.username;
        try { // catch malformed request
          battleToJoin = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'invalid battle name');
          console.log(e);
        }

        // if already in a game, leave it
        if (client.state.room != null) {
          this.rooms[client.state.getRoom()].removePlayer(client.state.username);
        }


        try { // catch new room
          this.rooms[battleToJoin].setPlayer(username, 'A');
        } catch {
          this.rooms[battleToJoin] = new RoomState(battleToJoin, client.state.username, '9440', Object.keys(this.rooms).length);
          this.rooms[battleToJoin].setRoomName(battleToJoin);
          const autohostNum = this.loadBalance();
          const autohostIPNum = autohostServer.autohostIDtoIP(autohostNum);
          this.rooms[battleToJoin].setResponsibleAutohost(autohostIPNum);
        }
        client.state.joinRoom(battleToJoin);
        // const playerList = this.rooms[battleToJoin].getPlayers();
        for (const ppl in this.players) {
          // now let everyone else know
          this.stateDump(this.players[ppl], 'JOINGAME', reqId);
        }
        break;
      }
      case 'MIDJOIN': {
        if (!client.state.loggedIn) return;
        let battleName;
        let isSpec;
        let team;
        try {
          battleName = message['parameters']['battleName'];
          isSpec = message['parameters']['isSpec'];
          team = message['parameters']['team'];

          if (!(battleName in this.rooms)) throw new Error('invalid battle name');
        } catch (e) {
          this.clientSendNotice(client, 'error', 'no sufficient parameters');
          break;
        }

        const room = this.rooms[battleName];

        try {
          const token = room.engineToken;
          this.autohostManger.midJoin(room, {
            playerName: client.state.username,
            isSpec,
            team,
            token,
          });
        } catch (e) {
          this.clientSendNotice(client, 'error', 'no engine token');
          break;
        }
      }

      case 'haveMap': {
        if (!client.state.loggedIn) return;
        let mapToHave;
        try {
          mapToHave = message['parameters']['mapName'];
        }
        catch (e) {
          this.clientSendNotice(client, 'invalid map name');
        }
        client.state.reportHaveMap(mapToHave);
        const battle = client.state.getRoom();
        if (battle in this.rooms) {
          const playerList = this.rooms[battle].getPlayers();
          const playerListObj = this.usernames2ClientObj(playerList);
          for (const ppl of playerListObj) {
            this.stateDump(ppl, 'haveMap', reqId);
          }
          break;
        } else {
          break;
        }
      }
      case 'LEAVEGAME': { // leave a game
        console.log('LEAVEGAME');
        if (!client.state.loggedIn) return;
        console.log('received leaving game req');
        console.log(message['parameters']);
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

        this.rooms[battleToLeave].removePoll(client.state.username);

        const playerList = this.rooms[battleToLeave].getPlayers();
        const playerListObj = this.usernames2ClientObj(playerList);


        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'LEAVEGAME', reqId);
        }

        console.log('Battle players: ', playerList);
        console.log('room status: ', this.rooms[battleToLeave].isStarted);
        if (playerList.length === 0 && this.rooms[battleToLeave].isStarted === false) {
          console.log('Deleteing game ', battleToLeave);
          delete this.rooms[battleToLeave];
        }

        // let the client that left know
        this.stateDump(client, 'LEAVEGAME', reqId);
        break;
      }
      case 'ADDFREUND': {
        console.log('friend', message);
        if (!client.state.loggedIn) return;
        // let freundtoadd;
        // let username;

        const freundtoadd = message['parameters']['freund'];
        const username = client.state.username;
        const server = this;
        this.dataManager.addConfirmation(username, freundtoadd + 'has requested you to be their friend', 'friend', freundtoadd).then(() => {
          server.clientSendNotice(client, 'success', 'sent request');

          server.stateDump(client, 'ADDFREUND', reqId);
        });


        break;
      }

      case 'CONFIRMSYSMSG': {
        let confirmationId;
        let acceptOrNot = false;
        let username;
        const server = this;
        try {
          confirmationId = message['parameters']['id'];
          acceptOrNot = message['parameters']['isAccepted'];
          username = client.state.username;
          if (acceptOrNot) {
            server.dataManager.confirm(username, confirmationId).then((res) => {
              if (res) {
                client.state.notifications = server.dataManager.getNotifications(username);
                server.clientSendNotice(client, 'success', 'confirmed');
                server.dataManager.getConfirmation(username, confirmationId).then((whatIhaveConfirmed) => {
                  switch (whatIhaveConfirmed.type) {
                    case 'friend':
                      server.dataManager.addFriend(username, whatIhaveConfirmed.parameters).then((addRes) => {
                        try {
                          if (addRes === 'added') {
                            client.state.freunds.push({
                              username: freundtoadd,
                            });
                          } else {
                            server.clientSendNotice(client, 'error', addRes);
                          }
                        } catch (e) {
                          console.log('frined', e);
                          server.clientSendNotice(client, 'error', 'invalid freund');
                        } // hackery going on
                      });
                  }
                });
              }
              else {
                server.clientSendNotice(client, 'error', res);
              }
            });
          }
        } catch (e) {
          server.clientSendNotice(client, 'error', 'invalid confirmation');
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
        if (this.rooms[battleToStart].isStarted) {
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
          // this.stateDump(reqId, client, 'STARTGAME');
          this.clientSendNotice(client,
            'error',
            'not enough players to start game');
        }
        // dont statedump at this moment
        // statedump for start is called upon autohost return in processautohost!


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
            this.rooms[battleToSetTeam].clearPoll(action);;
            if (teamToSet === '-1') {
              if (isCircuit) this.rooms[battleToSetTeam].removeAI(playerToSetTeam);
              else if (isChicken) this.rooms[battleToSetTeam].removeChicken(playerToSetTeam);
              else this.rooms[battleToSetTeam].removePlayer(playerToSetTeam);
            } else {
              if (isCircuit) this.rooms[battleToSetTeam].setAI(playerToSetTeam, teamToSet);
              else if (isChicken) this.rooms[battleToSetTeam].setChicken(playerToSetTeam, teamToSet);
              else this.rooms[battleToSetTeam].setPlayer(playerToSetTeam, teamToSet, isSpec);
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
        const playerListObj = this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'SETTEAM', reqId);
        }

        break;
      }

      case 'SETAIHOSTER': {
        try {
          // is a Array of usernames
          const aiHosters = message['parameters'].aiHosters;
          if (!client.state.room) throw new Error('joined no room');

          const players = this.rooms[client.state.room].getPlayers();
          for (const hoster of aiHosters) {
            if (!players.includes(hoster)) {
              throw new Error('invalid hoster');
            }
          }


          const room = this.rooms[client.state.room];
          const aiHosterAction = action + JSON.stringify(aiHosters);
          room.addPoll(client.state.username, aiHosterAction);

          if (room.hoster === client.state.username ||
            room.getPollCount(aiHosterAction) >= room.getPlayerCount() / 2) {
            room.setAIHoster(aiHosters);
            room.clearPoll(aiHosterAction);
          }
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid ai hoster');
        }

        break;
      }
      case 'SETMAP': { // set the map
        if (!client.state.loggedIn) return;
        let battleToSetMap;
        let mapId;
        try {
          battleToSetMap = message['parameters']['battleToSetMap'];
          // mapToSet = message['parameters']['map'];
          mapId = message['parameters']['mapId'];
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
            this.rooms[battleToSetMap].clearPoll(action);
            // this.rooms[battleToSetMap].setMap(mapToSet);
            this.rooms[battleToSetMap].setMapId(mapId);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        }

        const playerList = this.rooms[battleToSetMap].getPlayers();
        const playerListObj = this.usernames2ClientObj(playerList);
        for (const ppl of playerListObj) {
          this.stateDump(ppl, 'SETMAP', reqId);
        }
        break;
      }
      case 'setRoomNotes': {
        if (!client.state.loggedIn) return;
        let roomName;
        let notes;
        try {
          roomName = message['parameters']['roomName'];
          notes = message['parameters']['notes'];
        }
        catch (e) {
          this.clientSendNotice(client, 'error', 'invalid room name');
        }
        if (this.rooms[battleToSetMap].getPollCount(action) >=
          this.rooms[battleToSetMap].getPlayerCount() ||
          client.state.username ==
          this.rooms[battleToSetMap].getHoster()) {
          try {
            this.rooms[roomName].clearPoll(action);
            this.rooms[roomName].setRoomNotes(notes);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        }
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
            autohostServer.killEngine(this.rooms[battleToStop]);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          this.clientSendNotice(client,
            'error',
            'not enough players to stop game');
        }
        // notify players in processautohost!
      }

      default: {
        eventEmitter.emit('invalidCommandFromClient', client, message);
      }
    }
  }

  processPing(client) {
    function checkPing() {
      client.send(JSON.stringify({ 'action': 'PING' }));
      if (!client.respondedKeepAlive) {
        client.connectivity--;
      } // deduct client hp if it hasnt responded the previous ping
      // this will be set true once the client responds
      client.respondedKeepAlive = false;
      if (client.connectivity <= 0) {
        client.emit('clearFromLobbyMemory');
        // server.logOutClient(client);
      }
    }
    return setInterval(checkPing, 5000);
  }


  clientSendNotice(client, type, msg) {
    client.send(JSON.stringify({
      'action': 'NOTICE', 'parameters': { 'type': type, 'msg': msg },
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
    if (!client.state) {
      console.log('not state found in client');
      return;
    }
    clearInterval(client.keepAlive);

    const deepFreezedChat = JSON.parse(JSON.stringify(client.state.chats));
    for (const chat in deepFreezedChat) {
      this.processLoggedClient(client, { 'action': 'LEAVECHAT', 'parameters': { 'chatName': deepFreezedChat[chat] } });
      console.log('leaving chat' + chat);
    }
    console.log('leaving battle' + client.state.room);
    try {
      this.processLoggedClient(client, { 'action': 'LEAVEGAME', 'parameters': { 'battleName': client.state.room } });
    }
    catch {
      console.log('no more battles');
    }


    client.close();
    delete this.players[client.state.username];
  }



  // let everyone in chat global hear the message said by the user
  sayChatBridge(username, msg) {
    const server = this;
    if (!this.chats.chats['global']) return;

    const pplObjs = this.usernames2ClientObj(server.chats.chats['global'].allMembers);
    for (const ppl of pplObjs) {
      // now let everyone else know
      // the line below is used for plasmid statedump
      ppl.state.writeChatMsg({
        'author': username,
        'msg': msg,
        'chatName': 'global',
      });
      server.stateDump(ppl, 'SAYCHATBRIDGE');


    }
  }
  // set an event listener for client disconnect

  stateDump(ppl, triggeredBy = 'DefaultTrigger', reqId = 'defaultReq') {
    // TODO: should add a filter for messages delivering

    // get all games
    const games = this.getAllGames();

    // get chat index
    const chatIndex = this.getChatIndex();


    // dump the poll as well if the person is in a game

    const response = {
      'games': games,
      'chatsIndex': chatIndex,
      'usrstats': ppl.state.getState(),
    };
    // console.log(ppl.state.getState());
    // console.log(response);
    ppl.send(JSON.stringify({
      'id': reqId,
      'action': 'stateDump',
      triggeredBy,
      paramaters: response,
    }));
    ppl.state.eraseChatMsg();
  }

  getChatIndex() {
    const chatDictToReturn = {};
    for (const chatName in this.chats.chats) {
      chatDictToReturn[chatName] = {
        chatType: this.chats.chats[chatName].chatType,
        chatDescription: this.chats.chats[chatName].chatDescription,
        clients: this.chats.chats[chatName].allMembers,
      };
    }
    return chatDictToReturn;
  }

  getAllGames() {
    const games = [];


    // eslint-disable-next-line guard-for-in
    for (const battle in this.rooms) {
      const mapOwningPlayersList = []; // this block here checks if the map is currently retireved by a player in this room
      const playerList = this.rooms[battle].getPlayers();
      for (const player of playerList) {
        if (player.includes(this.rooms[battle].getMap())) {
          mapOwningPlayersList.push(player);
        }
      }


      games.push({
        'polls': this.rooms[battle].getPolls(),
        'mapOwningPlayers': mapOwningPlayersList,
        'battleName': this.rooms[battle].getTitle(),
        'isStarted': this.rooms[battle].checkStarted(),
        'players': { 'AIs': this.rooms[battle].ais, 'players': this.rooms[battle].players, 'chickens': this.rooms[battle].chickens },
        'map': this.rooms[battle].getMap(),
        'port': this.rooms[battle].getPort(),
        'ip': this.rooms[battle].getResponsibleAutohost(),
        'id': this.rooms[battle].getID(),
        'engineToken': this.rooms[battle].engineToken,
        'notes': this.rooms[battle].getRoomNotes(),
      });
    }
    return games;
  }

  /**
   * @description function determine which server should be used
   * @return {Number}
   */
  loadBalance() {
    return 0;
  }
}

module.exports = {
  LobbyServer,
};
