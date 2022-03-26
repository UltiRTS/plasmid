/* eslint-disable require-jsdoc */
class ClientState {
  loggedIn = false;
  accLevel = '';
  chats = [];
  room = null;
  team = '';
  username = '';
  freunds=[];
  chatMsg = null;
  userID='';
  notifications = [];
  ownedMaps=[];

  constructor(options={
    username: '',
    accLevel: '',
    id: -1,
    freunds: [],
    notifications: [],
    ownedMaps: [],
  }) {
    this.username = options.username;
    this.accLevel = options.accLevel;
    this.userID = options.id;
    this.loggedIn = true;
    this.freunds=options.freunds;
    this.notifications=options.notifications;
    this.ownedMaps=options.ownedMaps;
  }

  login() {
    this.loggedIn = true;
  }

  reportHaveMap(mapName) {
    this.ownedMaps.push(mapName);
  }

  writeUserID(id) {
    this.userID=id;
  }

  logout() {
    this.loggedIn = false;
  }

  joinChat(chatName) {
    if (!(chatName in this.chats)) this.chats.push(chatName);
  }

  leaveChat(chatName) {
    const targetIndex = this.chats.findIndex((chat) => chat === chatName);
    if (targetIndex !== undefined) this.chats.splice(targetIndex, 1);
  }

  joinRoom(roomName) {
    this.room = roomName;
    this.team = 'A';
  }

  getRoom() {
    return this.room;
  }

  leaveRoom() {
    this.room = null;
  }

  joinTeam(_team) {
    if (this.room == '') return;

    this.team = _team;
  }

  leaveTeam() {
    this.team = '';
  }

  getState() {
    // console.log('client prototype returning chatmsg');
    // console.log(this.chatMsg);
    return {
      loggedIn: this.loggedIn,
      accLevel: this.accLevel,
      chats: this.chats,
      room: this.room,
      team: this.team,
      fruneds: this.freunds,
      chatMsg: this.chatMsg,
      username: this.username,
      notifications: this.notifications,
    };
  }

  overwriteFreund(friendList) {
    this.freunds=friendList;
  }

  writeChatMsg(msg) {
    this.chatMsg = msg;
    // console.log('writing chat msg');
    // console.log(this.chatMsg);
  }
  eraseChatMsg() {
    console.log('erasing chat msg');
    this.chatMsg = null;
  }
}

module.exports = {
  ClientState,
};
