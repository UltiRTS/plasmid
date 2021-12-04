/* eslint-disable require-jsdoc */
/* eslint-disable guard-for-in */
initAutohostMgrClientNetwork = require('../libnetwork/libautohostMgrNetwork');

class AutohostMgrClient {
  constructor() {
    for (const autohost in config['autohostMgr']) {
      config['autohostMgr'][autohost] = initAutohostMgrClientNetwork(autohost);
      config['autohostMgr'][autohost].on('open', function open() {
        console.log('->System Component Online: ' + autohost);
      });


      config['autohostMgr'][autohost].on('message', function incoming(message) {
        eventEmitter.emit('commandFromAutohost', ws, JSON.parse(message));
      });

      config['autohostMgr'][autohost].onclose = function() {
        console.log('->System Component Offline|rebooting in 30 secs: ' +
        autohost);
        config['autohostMgr'][autohost].disabled = true;
        setTimeout(function() {
          autohostClient.reinitAutohost(autohost);
          // console.log('reiniting autohost' + autohost)
        }, 30000);
      };

      config['autohostMgr'][autohost].onerror = function() {
        ws.close();
      };
    }
  }

  reinitAutohost(autohost) {
    console.log('subseq reiniting autohost' + autohost);
    config['autohostMgr'][autohost] = initAutohostMgrClientNetwork(autohost);
    config['autohostMgr'][autohost].on('open', function open() {
      console.log('->System Component Online: ' + autohost);
    });

    config['autohostMgr'][autohost].on('message', function incoming(message) {
      eventEmitter.emit('commandFromAutohost', ws, JSON.parse(message));
    });

    config['autohostMgr'][autohost].onclose = function() {
      console.log('->System Component Offline: ' + autohost);
      config['autohostMgr'][autohost].disabled = true;
      setTimeout(function() {
        autohostClient.reinitAutohost(autohost);
      }, 30000);
    };

    config['autohostMgr'][autohost].onerror = function() {
      ws.close();
    };
  }

  autohostMgrCreatRoom(roomObj) {
    // this number could be returned by a load balancing function instead
    const autohost=roomObj.responsibleAutohost;

    const roomID=roomObj.ID;
    config['autohostMgr'][autohost].send(
        JSON.stringify({
          'action': 'NEWROOM',
          'parameters': {'roomID': roomID, 'obj': roomObj}}),
    );
  }

  autohostMgrSayBattle(roomObj, what2Say) {
    const autohost=roomObj.responsibleAutohost;

    const roomID=roomObj.ID;
    config['autohostMgr'][autohost].send(
        JSON.stringify({'action': 'SAYROOM',
          'parameters': {'roomID': roomID, 'txt': what2Say}}),
    );
  }

  autohostMgrKillEngine(roomObj) {
    const autohost=roomObj.responsibleAutohost;

    const roomID=roomObj.ID;
    config['autohostMgr'][autohost].send(
        JSON.stringify({'action': 'KILLENGINE',
          'parameters': {'roomID': roomID}}),
    );
  }
}
module.exports = AutohostMgrClient;
