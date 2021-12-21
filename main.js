const PlasmidLobbyServer = require('./lobbyServer/lobbyServer');
const PlasmidGameServer = require('./autohostServer/autohostManager.js');

// eslint-disable-next-line no-unused-vars
const Config=require('./config.js').config;
// console.log(Config)
// global.config=Config.config

const Database= require('./libdatabase/libdatabase');
global.database=new Database(Config.db);

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();


/* START BUSINESS LOGIC*/
lobbyServer=new PlasmidLobbyServer();
autohostServer=new PlasmidGameServer(Config.autohosts);

