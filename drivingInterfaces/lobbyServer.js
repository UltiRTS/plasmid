/* eslint-disable brace-style */
/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {initLobbyServerNetwork} = require('../lib/lobbyServerNetwork');
// const ClientState = require('./clientState').default;
const {ClientState} = require('../state/client');
const {RoomState} = require('../state/room');
const ChatObj = require('../state/chat');


const {clearInterval} = require('timers');
const {stat} = require('fs');
// const eventEmitter = new EventEmitter()

class LobbyServer {
  chats = {};
  rooms = {};
  players = {}; // holds all connected clients;

  constructor(port, database) {
    this.database = database;

    console.log('lobby server started!');
    initLobbyServerNetwork(port);
    const server = this;
    eventEmitter.on('commandFromClient', async function(client, message) {
      // unlloged in, we log it in and check if the client agreed to the contract
      // when registering; if not, we reprompt the contract
      if (!sanityCheckClient()) return;
      if (message['action'] == 'LOGIN') {
        server.database.authenticate(message['parameters'])
            .then((dbRet)=>loginClientWithLimitsCheck(dbRet));
      }

      // logged in, we assume the client has received contract prompt during login, it
      // has to agree to it now to continue. Or, it may continue if it agreed to it previously
      else if ('state' in client && client.state.loggedIn) {
        const status = await server.database.checkBlocked(client.state.username);
        switch (status) {
          case 'no':
            server.processLoggedClient(client, message);
            break;
          case 'regConfirm':
            if (message['action'] == 'regConfirm') {
              server.database.confirmReg(client.state.username).then((dbRet) => {
                server.processLoggedClient(client, message);
              });
            } else {
              eventEmitter.emit('clearFromLobbyMemory', client);
            }
        }
      }

      // unregistered, we register, then login with contract prompt
      else if (message['action'] == 'REGISTER') {
        const username = message['parameters']['usr'];
        const dup = await server.database.checkDup(username);
        if (dup) {
          server.database.authenticate(message['parameters'])
              .then((dbRet)=>loginClientWithLimitsCheck(dbRet));
        } else {
          server.database.register(message['parameters'])
              .then(function(dbRet) {
                loginClientWithLimitsCheck(dbRet);
              });
        }
      }


      // garbage data, disconnect
      else {
        eventEmitter.emit('clearFromLobbyMemory', client);
      }

      async function loginClientWithLimitsCheck(dbRet) {
        if (!dbRet[0]) {return;}
        const status = await server.database.checkBlocked(message['parameters']['usr']);
        switch (status) {
          case 'regConfirm':
            server.database.getSignUpContract().then((contract) => {
              server.clientSendNotice(client, 'regConfirm', contract);
              loginClient(dbRet);
            });
            break;
          default:
            loginClient(dbRet);
        }
      }

      async function loginClient(dbRet) {
        const isLoggedIn = dbRet[0];
        if (isLoggedIn) {
          client.state = new ClientState({
            username: message['parameters']['usr'],
            accLevel: dbRet[1],
          });
          client.state.login();
          const userID = await server.database.getUserID(client.state.username);
          client.state.writeUserID(userID);

          // console.log('client authenticated');
          client.connectivity = 10;
          client.respondedKeepAlive = true;
          client.keepAlive = server.processPing(client);

          server.players[client.state.username] = client;

          server.stateDump(client, 'LOGIN');
        }
        else {
          server.clientSendNotice(client, 'errorLogin', 'Incorrect credentials');
        }
      }

      function sanityCheckClient() {
        return true;
      }
    });


    eventEmitter.on('clearFromLobbyMemory', function(client) {
      console.log('logging out this client');
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
        console.log('received joinchat req');
        let chatToJoin;
        try {
          chatToJoin = message['parameters']['chatName'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat name');
        }

        if (!(chatToJoin in this.chats)) this.chats[chatToJoin] = new ChatObj(chatToJoin);
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
        let channelName;
        let chatMsg;
        try {
          channelName = message['parameters']['chatName'];
          chatMsg = message['parameters']['msg'];
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid chat message');
        }
        // console.log(channelName);
        // console.log(this.chats);
        // console.log(this.chats[channelName].clients);
        if (channelName in this.chats && this.chats[channelName].clients.includes(client.state.username)) {
          this.chats[channelName].recordChat(client.state.username, channelName, chatMsg);
          const pplObjs=this.usernames2ClientObj(this.chats[channelName].clients);
          for (const ppl of pplObjs) {
            // now let everyone else know
            // console.log('sending chat to ' + ppl.state.username);
            ppl.state.writeChatMsg({'channelName': channelName, 'author': client.state.username, 'msg': chatMsg});
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
        for (const ppl of this.chats[chatToLeave].clients) {
          this.stateDump(ppl, 'LEAVECHAT');
        }
        break;
      }
      case 'JOINGAME': { // join a game
        let battleToJoin;
        const username=client.state.username;
        try { // catch malformed request
          battleToJoin = message['parameters']['battleName'];
        } catch (e) {
          this.clientSendNotice(client, 'invalid battle name');
          console.log(e);
        }

        // if already in a game, leave it
        if (client.state.room!='') {
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
        let freundtoadd=false;
        let username;
        try {
          freundtoadd = message['parameters']['freund'];
          username = client.state.username;
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid freund');
        } // hackery going on
        if (!freundtoadd) {
          break;
        }
        // get the userID of the freund
        const freundID = await this.database.getUserID(freundtoadd);
        this.database.writeNotification(freundID, 0,
            'freundConfirmation', username + ' requested to be ur freined');
        break;
      }

      case 'CONFIRMSYSMSG': {
        let idtoconfirm;
        let requesterusrname = false;
        let AcceptNum;
        try {
          idtoconfirm = message['parameters']['id'];
          AcceptNum = message['parameters']['AcceptNum'];
          requesterusrname = client.state.username;
        } catch (e) {
          this.clientSendNotice(client, 'error', 'invalid confirmation');
        }
        if (!requesterusrname)
        {
          break;
        }
        // what AcceptNum is used for?
        const userID = await this.database.getUserID(requesterusrname);
        if (userID === -1) this.clientSendNotice(client, 'error', 'no such uesr');
        if (AcceptNum === -1) return;

        const msgStatus = await this.database.checkSysMsgStatus(idtoconfirm, userID);
        if (msgStatus === '0') {
          const confirmDict = this.database.confirmSysMsg(idtoconfirm, userID, AcceptNum);
          switch (confirmDict['confirmationType']) {
            case 'freundConfirmation': {
              const userFriendList = await this.database.insertFreund(idtoconfirm, userID);
              client.overwriteFreund(userFriendList);
              this.stateDump(client, 'CONFIRMSYSMSG');

              const friendFriendList = await this.database.insertFreund(confirmDict['requestingUser'], requesterusrname);
              const anotherParty = this.usernames2ClientObj([confirmDict['requestingUser']])[0];
              anotherParty.overwriteFreund(friendFriendList);
              this.stateDump(anotherParty, 'CONFIRMSYSMSG');
              break;
            }
          }
        } else if (msgStatus === '-1') {
          this.clientSendNotice(client, 'error', 'You already declined!');
        } else if (msgStatus === '1') {
          this.clientSendNotice(client, 'error', 'message already confirmed');
        }
        break;
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
            // this.rooms[battleToStart].id=this.rooms;
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
        let battleToSetTeam;
        let team;
        let AIs;
        let chickens;
        let spectators;
        try {
          battleToSetTeam = message['parameters']['battleName'];
          team = message['parameters']['team']; // [{'tom': 'A'}]
          AIs = message['parameters']['AIs'];
          chickens = message['parameters']['chickens'];
          spectators = message['parameters']['spectators'];
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
            const players2set = this.rooms[battleToSetTeam].getPlayers();
            if (players2set.length !== team.length) {
              this.clientSendNotice(client, 'error', 'invalid team');
              break;
            }

            this.rooms[battleToSetTeam].pushAIs(AIs);
            this.rooms[battleToSetTeam].pushChickens(chickens);
            this.rooms[battleToSetTeam].pushSpectators(spectators);
            this.rooms[battleToSetTeam].pushPlayers(team);
          } catch (e) {
            console.log('NU', e);
          } // hackery going on
        } else {
          this.clientSendNotice(client,
              'error',
              'not enough players to set team');
        }


        const playerList = this.rooms[battleToSetTeam].getPlayers();
        const spectatorList = this.rooms[battleToSetTeam].spectators;
        playerList.push(...spectatorList);
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
    try {
      for (const chat of client.state.joinedChats) {
        this.processLoggedClientCmd('LEAVECHAT', client, {'chatName': chat});
      }
    } catch (e) {
      console.log('client has no active chats');
    }

    // if the client is present in this.chats.clients, remove it
    for (const chat in this.chats) {
      if (this.chats[chat].clients.includes(client.state.username)) {
        this.chats[chat].clients.splice(this.chats[chat].clients.indexOf(client.state.username), 1);
      }
      else {
        console.log('chats dont have such client');
      }
    }


    try {
      // remove client from all battles
      this.processLoggedClientCmd('LEAVEGAME', client, {
        'battleName': client.state.room,
      });}
    catch (e) {
      console.log('client has no active battles');
    }

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


    this.database.getAllNotifications(ppl.state.userID).then((notifications) => {
      // console.log(ppl.state.getState());
      const response = {
        'games': games,
        'chatsIndex': chatIndex,
        'notifications': notifications,
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
        'players': {'AIs': this.rooms[battle].AIs, 'players': this.rooms[battle].players, 'chickens': this.rooms[battle].chickens},
        'map': this.rooms[battle].getMap(),
        'port': this.rooms[battle].getPort(),
        'ip': this.rooms[battle].getResponsibleAutohost(),
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
