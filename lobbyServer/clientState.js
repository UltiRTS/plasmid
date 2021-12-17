/* eslint-disable require-jsdoc */
class ClientState {
  loggedIn = false;
  accLevel = '';
  chats = [];
  room = '';
  team = '';
  token = '';
  username = '';

  constructor(_token, options={
    username: '',
    accLevel: '',
  }) {
    this.token = _token;
    this.username = options.username;
    this.accLevel = options.accLevel;
    this.loggedIn = true;
  }

  login() {
    this.loggedIn = true;
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
      username: this.username,
    };
  }
}

module.exports = {
  ClientState,
};
