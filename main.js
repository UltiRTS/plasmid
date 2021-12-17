const PlasmidLobbyServer = require('./lobbyServer/lobbyServer');

// why?
// eslint-disable-next-line no-unused-vars
const Config=require('./dev.conf');
// console.log(Config)
// global.config=Config.config

const Database= require('./libdatabase/libdatabase');
global.database=new Database('sqlite');

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();


/* START BUSINESS LOGIC*/
lobbyServer=new PlasmidLobbyServer();
