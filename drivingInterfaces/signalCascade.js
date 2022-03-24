const irc = require('irc');
const Discord = require('discord.js');

class CascadeRelay{
  constructor(config = {
    dcToken: "",
    ircServer: "",
    ircPort: 6667,
    ircChannels: ['#general'],
    dcChannel: 'bridge',
  }) {
    // from lobby
    this.dcReady = false;
    this.ircReady = false;

    this.dcClient = new Discord.Client({
      intents: ['GUILDS', 'GUILD_MESSAGES']
    });

    this.dcClient.on('ready', () => {
      this.dcReady = true;
      console.log('discord bot ready!');
    });

    this.dcClient.on('messageCreate', message => {
      if(message.channel != config.dcChannel) return;
      this.ircClient.say('#general', message.author + ' => ' + message.content);
    });

    this.dcClient.addListener('irc_msg', (sender, msg) => {
      if(this.dcReady == false) return;
      try {
        const guild = this.dcClient.guilds.cache.get('742383404418334782');
        const channels = guild.channels.cache.filter(c => c.name == config.dcChannel);
        for(const channel of channels) {
            channel[1].send(sender + ' => ' + msg);
        }
      } catch(e) {
        console.log('relay error');
        console.log(e);
      }
    });

    this.ircClient = new irc.Client(config.ircServer, 'bot', {
      channels: config.ircChannels
    });

    this.ircClient.on('registered', () => {
      this.ircReady = true;
      console.log("irc bot ready");
    });

    this.ircClient.addListener('message#general', (from, text, _) => {
      if(this.dcReady != true) return;
      this.dcClient.emit('irc_msg', from, text);
    });

    console.log(config.dcToken);
    this.dcClient.login(config.dcToken);
  }
}

module.exports = {
  CascadeRelay
}