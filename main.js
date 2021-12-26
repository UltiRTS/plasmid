/* eslint-disable max-len */
const {LobbyServer} = require('./lobbyServer/lobbyServer');
const {AutohostManager} = require('./autohostServer/autohostManager.js');

// eslint-disable-next-line no-unused-vars
const Config=require('./config.js').config;
// console.log(Config)
// global.config=Config.config

const Database= require('./libdatabase/libdatabase');
global.database=new Database(Config.db);

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();


/* START BUSINESS LOGIC*/


// eslint-disable-next-line no-unused-vars
autohostServer=new AutohostManager(Config.autohosts);
// eslint-disable-next-line no-unused-vars
lobbyServer=new LobbyServer();
