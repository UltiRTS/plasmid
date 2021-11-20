const wsmodule = require('ws')
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();


const WebSocket = wsmodule.WebSocket

function connect() {
    console.log('plasmidTest:')

    var ws = new WebSocket('ws://127.0.0.1:9090');

    ws.on('open', function open() {
        console.log('->connection established')
        eventEmitter.emit('connected')
    });

    ws.on('message', function incoming(message) {
        console.log('->received');
        console.log(JSON.parse(message))
        global.message = message


        let parsed = JSON.parse(message);
        switch(parsed.triggeredBy) {
            case 'LOGIN':
                triggerTable.connected(ws);
                break;
            case 'JOINCHAT':
                triggerTable.chatJoined(ws);
                break;
            case 'SAYCHAT':
                triggerTable.saidChat(ws);
                break;
            case 'LEAVECHAT':
                triggerTable.leftChat(ws);
                break;
            case 'JOINGAME':
                triggerTable.joinedGame(ws);
                break;
            case 'EXITGAME':
                triggerTable.exitedGame(ws);
                break;
        }
    });

    ws.onclose = function (e) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        setTimeout(function () {
            connect();
        }, 1000);
    };

    ws.onerror = function (err) {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        ws.close();
    };

    return ws;
}

const connectedCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'JOINCHAT',
        'parameters': {
            'chatName': 'testChat'
        }
    }))
}

const chatJoinedCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'SAYCHAT',
        'parameters': {
            'chatName': 'testChat',
            'msg': 'hello'
        }
    }))
}

const saychatCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'LEAVECHAT',
        'parameters': {
            'chatName': 'testChat',
        }
    }))
}

const leftChatCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'JOINGAME',
        'parameters': {
            'battleName': 'testBattle',
        }
    }))
}

const joinedGameCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'EXITGAME',
        'parameters': {
            'battleName': 'testBattle',
        }
    }))
}

const exitedGameCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'LEAVEGAME',
        'parameters': {
            'battleName': 'testChat',
        }
    }))
}

const startedGameCallback = (ws) => {
    ws.send(JSON.stringify({
        'action': 'STARTGAME',
        'parameters': {
            'battleName': 'testChat',
        }
    }))
}

const triggerTable = {
    connected: connectedCallback,
    chatJoined: chatJoinedCallback,
    saidChat: saychatCallback,
    leftChat: leftChatCallback,
    joinedGame: joinedGameCallback,
    exitedGame: exitedGameCallback,
    startedGame: startedGameCallback
}

var ws = connect()

eventEmitter.on('connected',function () {
    ws.send(JSON.stringify({'action':'LOGIN','parameters':{'usr':'admin123','passwd':'0192023a7bbd73250516f069df18b500'}}));
});