const initLobbyServerNetwork = require('../libnetwork/liblobbyServerNetwork')
const ClientState = require('./clientState').default;

const EventEmitter = require('events')
const { clearInterval } = require('timers');
const { urlToHttpOptions } = require('url');
//const eventEmitter = new EventEmitter()


class lobbyServer {

  constructor() {
    console.log('lobby server started!')
    initLobbyServerNetwork()
    let server = this;
    eventEmitter.on('commandFromClient', function (client, message, tmpClients) {

      if (message['action'] == 'LOGIN') {
        //console.log(client)
        global.database.authenticate(message['parameters']).then(function (dbRet) {
          var isLoggedIn = dbRet[0]
          var accessLevel = dbRet[1]
          if (isLoggedIn) { //process login
            client.loggedIn = true
            global.clients = tmpClients
            client.usrname = message['parameters']['usr']
            client.passwd = message['parameters']['passwd']
            client.accLvl = accessLevel
            client.joinedChats = []
            client.chatMsg = { 'channelName': '', 'msg': '' }
            client.joinedRoom = ''
            client.roomTeam = ''
            console.log('client authenticated')
            client.connectivity = 10
            client.respondedKeepAlive = true
            client.keepAlive = server.processPing(client)
            client.send(JSON.stringify({ 'action': 'LOGIN', 'parameters': { 'isLoggedIn': true, 'accessLevel': accessLevel } }))
            server.stateDump(client, 'LOGIN')
            //server.stateDump(client) //upon initial login, dump database stats for the user
            //clients[token].lobbyServerThread = new Worker('worker.js'); //now create a dedicated cmd parser for any cmd they send subsequently\
            //clients[token].lobbyServerThread.postMessage(message);
          }
        })
      }

      else if (client.loggedIn) {
        console.log("processing messages")
        server.processLoggedClient(client, message)
      }

    })

    eventEmitter.on('disconnect', function (client) {
      console.log('client disconnected')
      server.logOutClient(client)
    })

    eventEmitter.on('commandFromAutohost', function (client, message) {
      // do something with autohost incoming interface msg
    })
  }



  processLoggedClient(client, message) {
    var action = message['action']

    //var username = client.username

    switch (action) {

      case 'PONG': {
        client.respondedKeepAlive = true
      }


      case 'JOINCHAT': {
        let chatToJoin;
        try {
          chatToJoin = message['parameters']['chatName'];
        } catch(e) {
          this.clientSendNotice(client, 'error', 'invalid chat name')
        }

        if(!(chatToJoin in this.chats)) this.chats[chatToJoin] = [];
        console.log(Object.keys(this.chats))

        this.chats[chatToJoin].push(client)

        //now this user has joined chat
        //add this user to the chat's list of users
        client.joinedChats.push(chatToJoin)
        for (let ppl of this.chats[chatToJoin]) {  //now let everyone else know
          this.stateDump(ppl, 'JOINCHAT');
          //ppl.send(JSON.stringify({ 'action': 'JOINCHAT', 'parameters': { 'chatName': chatToJoin, 'usr': client.usrname } }))
        }
        
      break;
      }
      case 'SAYCHAT': {
        let channelName, chatMsg;
        try {
          channelName = message['parameters']['chatName'];
          chatMsg = message['parameters']['msg'];
        } catch(e) {
          this.clientSendNotice(client, 'error', 'invalid chat message')
          //client.send(JSON.stringify({ 'action': 'SAYCHAT', 'parameters': { 'type': 'error', 'msg': 'invalid chat message' } }))
        }

        console.log("channel: ", channelName);
        console.log("chatMsg: ", chatMsg);
        console.log("channels:", Object.keys(this.chats));

        console.log(channelName in this.chats);

        if(channelName in this.chats) {
          for (let ppl of this.chats[channelName]) {  //now let everyone else know
            ppl.chatMsg = { 'channelName': channelName, 'msg': chatMsg }
            this.stateDump(ppl, 'SAYCHAT')
            ppl.chatMsg = { 'channelName': '', 'msg': '' }
            //ppl.send(JSON.stringify({ 'action': 'SAYCHAT', 'parameters': { 'chatName': channelName, 'usr': client.usrname, 'msg': chatMsg } }))
          //check if this is a battlechat, if yes, forward to autohostMgrSayBattle
            if(this.rooms.hasOwnProperty(channelName)){
              let roomObj=this.rooms[channelName]
              autohostClient.autohostMgrSayBattle(roomObj,msg)}

          }
        } else {
          //client.send(JSON.stringify({ 'action': 'SAYCHAT', 'parameters': { 'type': 'error', 'msg': 'no such chat' } }))
          this.stateDump(client, 'SAYCHAT');
        }

        break;
      }
      case 'LEAVECHAT': {
        let chatToLeave;
        try {
          chatToLeave = message['parameters']['chatName'];
        } catch(e) {
          this.clientSendNotice(client, 'error', 'invalid chat name')
        }

        try {
          this.chats[chatToLeave].splice(this.chats[chatToLeave].indexOf(client), 1)
          console.log("LEAVING CHAT", chatToLeave);
          console.log(this.chats);
        } // remove client from chat
        catch { console.log('NU') } //hackery going on
        //remove this user from the chat's list of users
        client.joinedChats.splice(client.joinedChats.indexOf(chatToLeave), 1)
        client.send(JSON.stringify({ 'action': 'LEAVECHAT', 'parameters': { 'chatName': chatToLeave} }))
        for (let ppl of this.chats[chatToLeave]) {  //now let everyone else know
          //ppl.send(JSON.stringify({ 'action': 'LEAVECHAT', 'parameters': { 'chatName': chatToLeave, 'usr': client.usrname } }))
          this.stateDump(ppl, 'LEAVECHAT');
        }
        break;
      }
      case 'JOINGAME': { //join a game
        let battleToJoin;
        try {
          battleToJoin = message['parameters']['battleName'];
        } catch(e) {
          this.clientSendNotice(client, 'invalid battle name')
          //client.send(JSON.stringify({ 'action': 'JOINGAME', 'parameters': { 'type': 'error', 'msg': 'invalid battle name' } }))
        }

        try {
          this.rooms[battleToJoin].clients.push(client)
          this.rooms[battleToJoin].numofPpl += 1
        }
        catch {

          this.rooms[battleToJoin] = {
            'polls': {},
            'numofPpl': 1,
            'host': client,
            'clients': [client],
            'ID':this.rooms.length,
            'map': '',
            'mods': '',
            'password': '',
            'isStarted': false,
            'responsibleAutohost':0 //in the future this could be returned by a load balancing function
          }
        }
        client.joinedRoom = battleToJoin
        for (let ppl of this.rooms[battleToJoin].clients) {  //now let everyone else know
          //ppl.send(JSON.stringify({ 'action': 'JOINGAME', 'parameters': { 'battleName': battleToJoin, 'usrname': client.usrname } }))
          this.stateDump(ppl, 'JOINGAME');
        }
        break;
      }
      case 'LEAVEGAME': { //leave a game
        let battleToLeave;

        try {
          battleToLeave = message['parameters']['battleName'];
        } catch(e) {
          //client.send(JSON.stringify({ 'action': 'LEAVEGAME', 'parameters': { 'type': 'error', 'msg': 'invalid battle name' } }))
          this.stateDump(client, 'LEAVEGAME');
        }

        try {
          this.rooms[battleToLeave].clients.splice(this.rooms[battleToLeave].clients.indexOf(client), 1)
          this.rooms[battleToLeave].numofPpl--;
        }
        catch (e) { 
          this.clientSendNotice(client, 'error', 'something went wrong')
          //client.send(JSON.stringify({ 'action': 'LEAVEGAME', 'parameters': { 'type': 'error', 'msg': 'something go wrong' } }))  
          console.log(e);
          return;
        } //hackery going on
        client.joinedRoom = ''
        for (let ppl of this.rooms[battleToLeave].clients) {  //now let everyone else know
          //ppl.send(JSON.stringify({ 'action': 'LEAVEGAME', 'parameters': { 'battleName': battleToLeave, 'usr': client.usrname } }))
          this.stateDump(ppl, 'LEAVEGAME');
        }
      }

      /*room related cmds, might require poll!*/

      case 'STARTGAME': { //set isStarted to true and let everyone else know

        let battleToStart;
        try {
          battleToStart = message['parameters']['battleName'];
        } catch(e) {
          this.clientSendNotice(client, 'error', 'invalid battle name');
        }

        //add this cmd to the poll if it's not in the poll
        if (!this.rooms[battleToStart].polls.hasOwnProperty(action)) {
          this.rooms[battleToStart].polls[action] = []
        }
        this.rooms[battleToStart].polls[action].push(client)

        //if the poll is 50% or more, start the game
        if (this.rooms[battleToStart].polls[action].length >= Math.floor(this.rooms[battleToStart].numofPpl / 2)||client.usrname==this.rooms[battleToStart].host.usrname) {
          try {
            this.rooms[battleToStart].isStarted = true
            this.rooms[battleToStart].polls[action] = []
            autohostClient.autohostMgrCreatRoom(this.rooms[battleToStart])
          }
          catch(e) { console.log('NU', e) } //hackery going on

        }
        else{
          //this.stateDump(client, 'STARTGAME');
          this.clientSendNotice(client, 'error', 'not enough players to start game')
          //client.send(JSON.stringify({ 'action': 'STARTGAME', 'parameters': { 'type': 'info', 'msg': 'no much votes' } }));
        }


        for (let ppl of this.rooms[battleToStart].clients) {  //now let everyone else know
          //ppl.send(JSON.stringify({ 'action': 'STARTGAME', 'parameters': { 'battleName': battleToStart, 'usr': client.usrname } }))
          this.stateDump(ppl, 'STARTGAME');
        }
        break;
      }






      case 'EXITGAME': {//set isStarted to false and let everyone else know
        let battleToStop;
        try {
          battleToStop = message['parameters']['battleName'];
        } catch(e) {
          this.clientSendNotice(client, 'error', 'invalid battle name');
        }
        //add this cmd to the poll if it's not in the poll
        if (!this.rooms[battleToStop].polls.hasOwnProperty(action)) {
          this.rooms[battleToStop].polls[action] = []
        }
        this.rooms[battleToStop].polls[action].push(client)

        //if the poll is 50% or more, exit the game
        if (
          this.rooms[battleToStop].polls[action].length >= Math.floor(this.rooms[battleToStop].numofPpl / 2)
          || client.usrname==this.rooms[battleToStart].host.usrname) {
          try {
            this.rooms[battleToStop].isStarted = false
            this.rooms[battleToStop].polls[action] = []
          }
          catch(e) { console.log('NU', e) } //hackery going on
        }
        else{
          this.clientSendNotice(client, 'error', 'not enough players to stop game')
        }

        for (let ppl of this.rooms[battleToStop].clients) {  //now let everyone else know
          //ppl.send(JSON.stringify({ 'action': 'EXITGAME', 'parameters': { 'battleName': battleToStop, 'usr': client.usrname } }))
          this.stateDump(ppl, 'EXITGAME');
        }

        autohostMgrKillEngine(this.rooms[battleToStop])
      }
        
    }



  }

  processPing(client) {
    var server = this;
    function checkPing() {
      client.send(JSON.stringify({ 'action': 'PING' }))
      if (client.respondedKeepAlive) { client.connectivity-- } //deduct client hp if it hasnt responded the previous ping
      client.respondedKeepAlive = false //this will be set true once the client responds
      if (client.connectivity <= 0) { 
        client.emit('disconnect')
        server.logOutClient(client) 
      }
    }
    return setInterval(checkPing, 30000)
  }


  clientSendNotice(client, type, msg) {
    client.send(JSON.stringify({ 'action': 'NOTICE', 'parameters': { 'type': type, 'msg': msg } }))
  }

  logOutClient(client) { //server inited disconnect


    
        //remove client from all chats
        for (let chat of client.joinedChats) {
          this.processLoggedClientCmd('LEAVECHAT', client, { 'chatName': chat })
        }
    
        //remove client from all battles
        for (let battle of client.joinedBattles) {
          this.processLoggedClientCmd('LEAVEGAME', client, { 'battleName': battle })
        }
        
        clearInterval(clients[token].keepAlive)
  }

  //set an event listener for client disconnect

  stateDump(ppl, triggeredBy='DefaultTrigger') {
    let usrstats = { 'isLoggedIn': ppl.loggedIn, 'usr': ppl.usrname, 'accessLevel': ppl.accessLevel } //selectively dumps properties in client to the userstats section of the response object
    // get all games
    let games = this.getAllGames()

    //get all chats that have this user in them
    let chats = ppl.joinedChats

    let chatMsg = ppl.chatMsg

    //cdump the poll as well if the person is in a game
    let poll = {}
    if (ppl.joinedRoom != '') {
      poll = getRoomPoll(ppl.joinedRoom)
    }



    let response = { 'usrstats': usrstats, 'games': games, 'chats': chats, 'chatmsg': chatMsg, 'poll': poll }

    ppl.send(JSON.stringify({
      'action':'stateDump', 
      triggeredBy,
      'paramaters':response}));
  }

  getAllGames() {
    let games = []
    
    for (let battle in this.rooms) {
      let players=getAllPlayers(this.rooms[battle])
      games.push({ 'battleName': battle, 'isStarted': this.rooms[battle].isStarted,'players':players})
    }
    return games
  }

  getAllPlayers(room) {
    let players = []
    for (let client of room.clients) {
      players.push(client.usrname)
    }
    return players
  }

  getRoomPoll(battle) {
    let poll = {}
    for (let action in this.rooms[battle].polls) {
      poll[action] = this.rooms[battle].polls[action].length/this.rooms[battle].numofPpl
    }
    return poll
  }


}

module.exports = lobbyServer