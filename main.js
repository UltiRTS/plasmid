const plasmidLobbyServer = require("./lobbyServer/lobbyServer");
const autohostMgrClient = require("./autohostClient/autohostMgrClient");



const Config=require('./dev.conf')
//console.log(Config)
//global.config=Config.config

const Database= require('./libdatabase/libdatabase')
global.database=new Database()

const EventEmitter = require('events');
global.eventEmitter = new EventEmitter()



/*BUSINESS GLOBAL VAR*/ 
global.clients = {}



/*START BUSINESS LOGIC*/ 
lobbyServer=new plasmidLobbyServer();
autohostClient= new autohostMgrClient();
