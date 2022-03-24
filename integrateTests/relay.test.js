const {CascadeRelay} = require('../drivingInterfaces/signalCascade');
const {discordToken, ircServer, config} = require('../config');

const csc = new CascadeRelay({ 
  dcToken: discordToken,
  ircServer: ircServer.addr,
  ircPort: ircServer.port,
  ircChannels: ['#general'],
  dcChannel: 'bridge'
});