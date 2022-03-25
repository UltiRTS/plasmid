const irc = require('irc');
const Discord = require('discord.js');


class discordIRCNetwork{
  constructor(config = {
    dcToken: "",
    ircServer: "",
    ircPort: 6667,
    ircChannels: ['#general'],
    dcChannel: 'bridge',
    username: "Thea, Inc. signalCascade",
    eventEmitter: eventEmitter,
  }) {
    this.config = config;
    // discord msg handler
    this.dcReady = false;
    this.ircReady = false;
    this.eventEmitter = config.eventEmitter;
    this.dcClient = new Discord.Client({
      intents: ['GUILDS', 'GUILD_MESSAGES']
    });

    this.dcClient.on('ready', () => {
      this.dcReady = true;
      // console.log('discord bot ready!');
      this.dcClient.user.setUsername(config.username);

      eventEmitter.emit('bridgeMessage', {'action': 'discordReady'});
    });


    // irc msg handler
    // console.log(config);
    this.ircClient = new irc.Client(config.ircServer, config.username, {
      channels: config.ircChannels
    });

    this.ircClient.on('registered', () => {
      this.ircReady = true;
      eventEmitter.emit('bridgeMessage', {'action': 'IRCReady'});
    });

    this.dcClient.on('messageCreate', message => {
      if(message.channel != config.dcChannel) return;
      // this.ircClient.say('#general', message.author + ' => ' + message.content);
      eventEmitter.emit('bridgeMessage', {'action': 'discordMsg', 'parameters': {'msg': message.content, 'sender': message.author}});
    });

    
    this.ircClient.addListener('message#general', (from, text, _) => {
      if(this.dcReady != true) return;
      // this.dcClient.emit('irc_msg', from, text);
      eventEmitter.emit('bridgeMessage', {'action': 'ircMsg', 'parameters': {'msg': text, 'sender': from}});
    });


    this.dcClient.login(config.dcToken);
  }

  send2discord(msg, sender) {
    if(this.dcReady != true) return;
    try {
      const guild = this.dcClient.guilds.cache.get('742383404418334782');
      const selfEnv = this;
      const channels = guild.channels.cache.filter(c => c.name == selfEnv.config.dcChannel);
      for(const channel of channels) {
          channel[1].send(sender + ' => ' + msg);
      }
    } catch(e) {
      console.log('relay error');
      console.log(e);
    }
  }

  send2irc(msg, sender) {
    if(this.ircReady != true) return;
    this.ircClient.say('#general', sender+'=>'+msg);
  }
}

module.exports = {
  discordIRCNetwork,
}