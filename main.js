/* eslint-disable max-len */
const {LobbyServer} = require('./lobbyServer');
const {AutohostManager} = require('./lib/autohostManager.js');

// eslint-disable-next-line no-unused-vars
const Config=require('./config.js').config;
// console.log(Config)
// global.config=Config.config

const Database= require('./lib/database');
global.database=new Database(Config.db);

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();


/* START BUSINESS LOGIC*/


// eslint-disable-next-line no-unused-vars
autohostServer=new AutohostManager(Config.autohosts);
// eslint-disable-next-line no-unused-vars
lobbyServer=new LobbyServer();
