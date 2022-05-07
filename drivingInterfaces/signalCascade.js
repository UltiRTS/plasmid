const {DiscordIRCNetwork} = require('../lib/discordIRCnetwork');

/**
 * @class SignalCascade
 */
class CascadeRelay {
  /**
   *
   * @param {EventEmitter} eventEmitter
   * @param {lobbyServer} lobbyServer
   * @param {String} selfUsername
   * @param {String} discordToken
   */
  constructor(eventEmitter, lobbyServer, selfUsername, discordToken) {
    const discordIRCNetworkObj = new DiscordIRCNetwork(
        {
          dcToken: discordToken,
          ircServer: '185.205.246.232',
          ircPort: 6667,
          ircChannels: ['#general'],
          dcChannel: 'bridge',
          username: selfUsername,
          eventEmitter: eventEmitter,
        },
    );


    eventEmitter.on('bridgeMessage', function(message) {
      if (message.action == 'discordReady') {
        // console.log('discord ready');
        discordIRCNetworkObj.send2irc('discord ready', 'discord');
        return;
      } else if (message.action == 'IRCReady') {
        // console.log('irc ready');
        discordIRCNetworkObj.send2discord('irc ready', 'irc');
        return;
      } else if (message.action == 'discordMsg') {
        discordIRCNetworkObj
            .send2irc(message.parameters.msg, message.parameters.sender);

        lobbyServer
            .sayChatBridge(message.parameters.sender, message.parameters.msg);
      } else if (message.action == 'ircMsg') {
        // console.log('irc msg');
        discordIRCNetworkObj
            .send2discord(message.parameters.msg, message.parameters.sender);

        lobbyServer
            .sayChatBridge(message.parameters.sender, message.parameters.msg);
      } else if (message.action == 'plasmidLobbyMsg') {
        // console.log('plasmidLobbyMsg');
        discordIRCNetworkObj
            .send2irc(message.parameters.msg, message.parameters.sender);
        discordIRCNetworkObj
            .send2discord(message.parameters.msg, message.parameters.sender);
      }
    });
  }
}

module.exports = {
  CascadeRelay,
};
