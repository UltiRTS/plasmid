class chatsPrototype{
  chats = {};

  chatFactory(chatType, chatDescription, chatPassword){
    return {'chatAuthor':'','lastMessage':'','allMembers':[], 'type': chatType, 'description': chatDescription, 'password': chatPassword};

  }

  channelGetLastMessage(chatname){
    return this.chats[chatname].message;
  }

  channelWriteLastMessage(chatname, message){
    this.chats[chatname].message = message;
  }

  createNewChat(chatname, chatType, chatDescription, chatPassword){
    this.chats[chatname] = this.chatFactory(chatType, chatDescription, chatPassword);
  }

  chatMemberJoinChat(chatname, member){
    this.chats[chatname].allMembers.push(member);
  }

  chatMemberLeaveChat(chatname, member){
    this.chats[chatname].allMembers.splice(chats[chatname].allMembers.indexOf(member), 1);
  }

  chatMemberSendMessage(chatname, member, message){
    this.chats[chatname].lastMessage = message;
    this.chats[chatname].chatAuthor = member;
  }
}


module.exports = {
  chatsPrototype,
};
