const {RoomState} = require('../state/room');

const state = new RoomState('test', 'Comet Catcher Redux', 0, '');

state.pushAIs([{'CircuitAI': 'A'}, {'CircuitAI': 'B'}, {'CircuitAI': 'C'}]);
state.pushChickens([{'Chicken': 'A'}, {'Chicken': 'B'}, {'Chicken': 'C'}]);
state.pushPlayers([{'player1': 'A'}, {'player2': 'B'}, {'player3': 'C'}]);
state.pushSpectators(['spectator1', 'spectator2', 'spectator3']);

console.log(state.AIs);
console.log(state.chickens);
console.log(state.players);

const engineStr = state.configureToStart();

console.log(engineStr);
