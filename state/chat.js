/* eslint-disable require-jsdoc */
class chatState {
  chatName = '';
  chatType='default';
  chatPassword='';
  chatDescription='';
  clients=[];
  constructor(chatName) {
    const chat=this;
    global.database.getChatTypePasswordDescription(chatName).then((dict)=>{
      try {
        chat.chatType=dict['chatType'];
        chat.chatPassword=dict['chatPassword'];
        chat.chatDescription=dict['chatDesc'];
      } catch (err) {
        chat.chatType='default';
        chat.chatPassword='';
        chat.chatDescription='Encrypted Chat';
      }
    });
  }

  recordChat(usr, chatName, msg) {
    global.database.recordChatHistory(usr, chatName, msg).then(() => {});
  }
}

module.exports = chatState;
