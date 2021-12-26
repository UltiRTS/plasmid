const {RoomState} = require('../lobbyServer/roomState');

const roomState = new RoomState('testHoster');

roomState.addAI('A');
roomState.addAI('B');

roomState.addPlayer('tom', 'A');
roomState.addPlayer('teddy', 'B');

roomState.addChicken('B');
roomState.addChicken('C');

roomState.addSpectator('spec1');

roomState.setMap('somemap');

const engineLaunchObj = roomState.enginize();

console.log(engineLaunchObj);
