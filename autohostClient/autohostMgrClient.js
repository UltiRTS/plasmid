initAutohostMgrClientNetwork = require('../libnetwork/libautohostMgrNetwork')

class autohostMgrClient {
    constructor() {
        for (var autohost in config['autohostMgr']) {
            config['autohostMgr'][autohost] = initAutohostMgrClientNetwork(autohost)
            config['autohostMgr'][autohost].on('open', function open() {
                console.log('->System Component Online: ' + autohost)

            });

            config['autohostMgr'][autohost].on('message', function incoming(message) {
                eventEmitter.emit('commandFromAutohost', ws, JSON.parse(message))
            });

            config['autohostMgr'][autohost].onclose = function (e) {
                console.log('->System Component Offline|rebooting in 30 secs: ' + autohost)
                config['autohostMgr'][autohost].disabled = true
                setTimeout(function () {
                    autohostClient.reinitAutohost(autohost);
                    //console.log('reiniting autohost' + autohost)
                }, 30000)
            };

            config['autohostMgr'][autohost].onerror = function (err) {

                ws.close();
            };
        }
    }

    reinitAutohost(autohost) {
        console.log('subseq reiniting autohost' + autohost)
        config['autohostMgr'][autohost] = initAutohostMgrClientNetwork(autohost)
        config['autohostMgr'][autohost].on('open', function open() {
            console.log('->System Component Online: ' + autohost)

        });

        config['autohostMgr'][autohost].on('message', function incoming(message) {
            eventEmitter.emit('commandFromAutohost', ws, JSON.parse(message))
        });

        config['autohostMgr'][autohost].onclose = function (e) {
            console.log('->System Component Offline: ' + autohost)
            config['autohostMgr'][autohost].disabled = true
            setTimeout(function () { autohostClient.reinitAutohost(autohost) }, 30000)
        };

        config['autohostMgr'][autohost].onerror = function (err) {

            ws.close();
        };
    }

    autohostMgrCreatRoom(roomObj) {
        let autohost=roomObj.responsibleAutohost //this number could be returned by a load balancing function instead
        
        let roomID=roomObj.ID
        config['autohostMgr'][autohost].send(
            JSON.stringify({ 'action': 'NEWROOM', 'parameters': { 'roomID': roomID, 'obj': roomObj } })
        )
    }

    autohostMgrSayBattle(roomObj,what2Say) {
        let autohost=roomObj.responsibleAutohost 
        
        let roomID=roomObj.ID
        config['autohostMgr'][autohost].send(
            JSON.stringify({ 'action': 'SAYROOM', 'parameters': { 'roomID': roomID,'txt':what2Say} })
        )
    }

    autohostMgrKillEngine(roomObj) {
        let autohost=roomObj.responsibleAutohost 
        
        let roomID=roomObj.ID
        config['autohostMgr'][autohost].send(
            JSON.stringify({ 'action': 'KILLENGINE', 'parameters': { 'roomID': roomID} })
        )
    }




}
module.exports = autohostMgrClient