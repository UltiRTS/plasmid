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
    this.msgBuff='';
    this.msgPermPtr = new Set();
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
      this.dcClient.user.setUsername(this.config.username);
      eventEmitter.emit('bridgeMessage', {'action': 'discordReady'});
    });


    // irc msg handler
    // console.log(config);
    // this.ircClient = new irc.Client(config.ircServer, config.username, {
    this.ircClient = new irc.Client(config.ircServer, "plasmidBot", {
      channels: config.ircChannels
    });

    this.ircClient.on('registered', () => {
      this.ircReady = true;
      eventEmitter.emit('bridgeMessage', {'action': 'IRCReady'});
    });

    this.dcClient.on('messageCreate', message => {
      this.msgPermPtr.add(message.guild.me);
      // console.log('network received discord msg');
      // if(message.channel != config.dcChannel) return;
      // if (message.content == this.msgBuff) return;
      if(message.author.bot) return;
      if (message.content == this.msgBuff) return;
      eventEmitter.emit('bridgeMessage', {'action': 'discordMsg', 'parameters': {'msg': message.content, 'sender': message.author.username}});
    });

    
    this.ircClient.addListener('message#general', (from, text, _) => {
      if (text == this.msgBuff) return;
      // if(message.author.bot) return;
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
      // this.dcClient.user.setUsername('Dr. '+sender+'@Thea, Inc.');

      this.msgBuff = msg;

      


      // call every memeber in this.msgPermPtr
      this.msgPermPtr.forEach(function(item){
        // console.log(item.permissions.has('MANAGE_NICKNAMES'));
        if (item.permissions.has('MANAGE_NICKNAMES')){
          item.setNickname('Dr. '+sender+'@Thea, Inc.');
          // console.log('nickname changed');
        }
      });
      
      
      for(const channel of channels) {
        // if (! this.msgPermPtr[message.channel]) return 
        channel[1].send(msg);
      }


      // this.dcClient.user.setUsername(this.config.username);
    } catch(e) {
      console.log('relay error');
      console.log(e);
    }
  }

  send2irc(msg, sender) {
    if(this.ircReady != true) return;
    this.msgBuff = msg;
    this.ircClient.say('#general', sender+'=>'+msg);
  }
}

module.exports = {
  discordIRCNetwork,
}