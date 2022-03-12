/* eslint-disable max-len */
const {LobbyServer} = require('./drivingInterfaces/lobbyServer');
const {AutohostManager} = require('./drivingInterfaces/autohostManager.js');

// eslint-disable-next-line no-unused-vars
const Config=require('./config.js').config;
// console.log(Config)
// global.config=Config.config

const {knexConf} = require('./config');
const {DataManager} = require('./lib/dataManager');
const dataManager = new DataManager(knexConf);

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();


/* START BUSINESS LOGIC*/


// eslint-disable-next-line no-unused-vars
autohostServer=new AutohostManager(Config.autohosts, Config.selfIP);
// eslint-disable-next-line no-unused-vars
lobbyServer=new LobbyServer(Config.port, dataManager, autohostServer);
