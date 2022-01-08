
/**
 * @class ChatState
 * @description for creating chat children in the primary chat index of statedump
 */
class ChatState {
  chatName = '';
  chatType='default';
  chatPassword='';
  chatDescription='';
  clients=[];

  /**
   *
   * @param {String} chatName the name for the newly created chat
   */
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


  /**
 *
 * @param {String} usr the username posted the chat.
 * @param {String} chatName the name of the chat that the user just posted in
 * @param {String} msg what the user said.
 */
  recordChat(usr, chatName, msg) {
    global.database.recordChatHistory(usr, chatName, msg).then(() => {});
  }
}

module.exports = ChatState;
