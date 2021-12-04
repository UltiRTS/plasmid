const PlasmidLobbyServer = require('./lobbyServer/lobbyServer');
const AutohostMgrClient = require('./autohostClient/autohostMgrClient');


// why?
// eslint-disable-next-line no-unused-vars
const Config=require('./dev.conf');
// console.log(Config)
// global.config=Config.config

const Database= require('./libdatabase/libdatabase');
global.database=new Database();

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter();


/* BUSINESS GLOBAL VAR*/
global.clients = {};


/* START BUSINESS LOGIC*/
lobbyServer=new PlasmidLobbyServer();
autohostClient= new AutohostMgrClient();
