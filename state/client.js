/* eslint-disable require-jsdoc */
class ClientState {
  loggedIn = false;
  accLevel = '';
  chats = [];
  room = '';
  team = '';
  username = '';
  freunds={};
  chatMsg = '';
  userID='';

  constructor(options={
    username: '',
    accLevel: '',
  }) {
    this.username = options.username;
    this.accLevel = options.accLevel;
    this.loggedIn = true;
  }

  login() {
    this.loggedIn = true;
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

  leaveRoom() {
    this.room = '';
  }

  joinTeam(_team) {
    if (this.room == '') return;

    this.team = _team;
  }

  leaveTeam() {
    this.team = '';
  }

  getState() {
    return {
      loggedIn: this.loggedIn,
      accLevel: this.accLevel,
      chats: this.chats,
      room: this.room,
      team: this.team,
      token: this.token,
      fruneds: this.freunds,
      chatMsg: this.chatMsg,
      username: this.username,
    };
  }

  overwriteFreund(friendList) {
    this.freunds=friendList;
  }

  writeChatMsg(msg) {
    this.chatMsg = msg;
  }

  getChatMsg() {
    return this.chatMsg;
  }
}

module.exports = {
  ClientState,
};