const {discordIRCNetwork} = require('../lib/discordIRCnetwork');

class CascadeRelay{
  constructor(eventEmitter, lobbyServer, selfUsername, discordToken){
    const discordIRCNetworkObj = new discordIRCNetwork(
      {
        dcToken: discordToken,
        ircServer: "",
        ircPort: 6667,
        ircChannels: ['#general'],
        dcChannel: 'bridge',
        username: selfUsername,
        eventEmitter: eventEmitter,
      }
    );
    const fakeLobbyClient = {'state':{'loggedIn': true,'username':'Anonymous'}};
    const fakeLobbyMessage = {'action':'SAYCHAT', 'parameters':{'msg':'Trash talk','chatName':'global', 'noBridge':true}};

    eventEmitter.on('bridgeMessage',  function(message) {
      // console.log(message);
      if (message.sender == selfUsername) return;
      if(message.action == 'discordMsg'){
        // console.log('discord msg');
        discordIRCNetworkObj.send2irc(message.parameters.msg, message.parameters.sender);

        fakeLobbyClient.state.username = message.parameters.sender;
        fakeLobbyMessage.parameters.msg = message.parameters.msg;
        lobbyServer.processLoggedClient(fakeLobbyClient, fakeLobbyMessage);
      }
      else if(message.action == 'ircMsg'){
        // console.log('irc msg');
        discordIRCNetworkObj.send2discord(message.parameters.msg, message.parameters.sender);

        fakeLobbyClient.state.username = message.parameters.sender;
        fakeLobbyMessage.parameters.msg = message.parameters.msg;
        lobbyServer.processLoggedClient(fakeLobbyClient, fakeLobbyMessage);

      }

      else if (message.action == 'plasmidLobbyMsg'){
        // console.log('plasmidLobbyMsg');
        discordIRCNetworkObj.send2irc(message.parameters.msg, message.parameters.sender);
        discordIRCNetworkObj.send2discord(message.parameters.msg, message.parameters.sender);
      }

      else if(message.action == 'discordReady'){
        // console.log('discord ready');
        discordIRCNetworkObj.send2irc('discord ready', 'discord');
      }
      else if(message.action == 'IRCReady'){
        // console.log('irc ready');
        discordIRCNetworkObj.send2discord('irc ready', 'irc');
      }
    });
  }

}

module.exports = {
  CascadeRelay
}