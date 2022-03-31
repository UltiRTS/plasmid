/* eslint-disable max-len */

// eslint-disable-next-line no-unused-vars
const Config=require('./config.js').config;
// console.log(Config)
// global.config=Config.config

const sharedConfig =  {

};

const {dbConfig} = require('./config');
knexConf = dbConfig[dbConfig.useDB];

const {DataManager} = require('./lib/dataManager');
const dataManager = new DataManager(knexConf);

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();

const {chatsPrototype} = require('./state/chats.js');
const chatsObj = new chatsPrototype();

const {DevPortalDriver} = require('./drivingInterfaces/devPortalDriver');
const devPortalDriver = new DevPortalDriver(global.eventEmitter, sharedConfig, dataManager, config={
  port: 10083,
  invite_token: 'token'
});
/* START BUSINESS LOGIC*/


// eslint-disable-next-line no-unused-vars
const {AutohostManager} = require('./drivingInterfaces/autohostManager.js');
autohostServer=new AutohostManager(Config.autohosts, Config.selfIP);
// eslint-disable-next-line no-unused-vars

const {LobbyServer} = require('./drivingInterfaces/lobbyServer');
lobbyServer=new LobbyServer(Config.port, dataManager, autohostServer, chatsObj);

const {CascadeRelay} = require('./drivingInterfaces/signalCascade');
const {bridgeUsername, discordToken} = require('./config');
const { globalAgent } = require('http');

const cascade = new CascadeRelay(eventEmitter, lobbyServer, bridgeUsername, discordToken);