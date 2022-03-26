const {WebSocketServer} = require('ws');
const {dbConfig} = require('../config');
const { DataManager } = require('../lib/dataManager');
const knexConf = dbConfig[dbConfig.useDB];

class DevPortalDriver {
  constructor(eventEmitter, config2manipulate, dataManager, config={
    port: 10083,
    invite_token: 'token'
  }) {
    this.eventEmitter = eventEmitter;
    this.config2manipulate = config2manipulate;
    this.dataManager = dataManager;
    // uncomment when dev
    this.dataManager = new DataManager(knexConf);

    this.invite_token = this.invite_token;

    this.wss = new WebSocketServer({
      port: config.port
    });

    // username -> websocket
    this.userTable = {

    };

    this.wss.on('connection', (ws, req) => {
      ws.on('message', (data, isBinary) => {
        if(isBinary) return;

        const msg = JSON.parse(data);
        this.processCommands(msg);
      });
      ws.on('close', (code, reason) => {
        if(ws.username) delete this.userTable[ws.username];
      });
    });
  }

  async processCommands(ws, msg) {
    switch(msg.action) {
      case 'register': {
        const neededParameters = ['username', 'password', 'priv_level', 'invite_token'];
        if(!this.checkParameters(msg, neededParameters)) {
          this.errorOut(ws, 'inficient_paramters', 'register');
          return;
        }
        const {username, password, priv_level, invite_token} = msg.parameters;
        if(invite_token !== this.invite_token) {
          this.errorOut(ws, 'invite_token_invalid', 'register');
          return;
        }

        const res = await this.dataManager.registerUser(username, password, priv_level)
        this.respond(ws, {
          action: 'register',
          success: res,
        });

        break;
      }
      case 'login': {
        const neededParameters = ['username', 'password'];
        if(!this.checkParameters(msg, neededParameters)) {
          this.errorOut(ws, 'inficient_paramters', 'login');
          return;
        }

        const { username, password } = msg.parameters;
        const res = await this.dataManager.login(username, password);
        if(res === 'verified') {
          ws.username = username;
          this.userTable[username] = ws;
          this.respond(ws, {
            action: 'login',
            success: true,
          });
        } else {
          this.errorOut(ws, res, 'login');
        }
      }

      case 'setSetting': {
        const neededParameters = ['key', 'value'];
        if(!this.checkParameters(msg, neededParameters)) {
          this.errorOut(ws, 'inficient_paramters', 'setSetting');
          return;
        }
        const { key, value } = msg.parameters;
        if(!ws.username || !(ws.username in this.userTable)) {
          this.errorOut(ws, 'not_logged_in', 'setSetting');
          return;
        }

        this.config2manipulate[key] = value;
        this.respond(ws, {
          action: 'setSetting',
          success: true,
          payload: this.config2manipulate,
        });
      }

      case 'getSetting': {
        const neededParameters = [];
        if(!this.checkParameters(msg, neededParameters)) {
          this.errorOut(ws, 'inficient_paramters', 'getSetting');
          return;
        }
        if(!ws.username || !(ws.username in this.userTable)) {
          this.errorOut(ws, 'user_not_found', 'getSetting');
          return;
        }
        this.respond(ws, {
          action: 'getSetting',
          success: true,
          payload: this.config2manipulate
        });
      }
      case 'logout': {
        if(!ws.username) return;
        this.userTable[ws.username] = null;
      }
    }
  }

  async respond(ws, msg) {
    ws.send(JSON.stringify(msg));
  }

  checkParameters(msg, neededParameters) {
    for(const p of neededParameters) {
      if(!(p in msg.parameters)) {
        return false;
      }
    }
    return true;
  }

  errorOut(ws, reason, action) {
    ws.send({
      action: 'error',
      at: action,
      reason: reason,
    });
  }
}

module.exports = {
  DevPortalDriver
}