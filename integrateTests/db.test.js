const {knexConf} = require('../config');
const {DataManager} = require('../lib/dataManager');

const dbm = new DataManager(knexConf);

const main = async () => {
  let res;
  res = await dbm.register('hello', 'pwd');
  console.log(res);
  res = await dbm.register('world', 'pwd');
  console.log(res);

  res = await dbm.queryUser('hello');
  console.log(res);
  res = await dbm.login('hello', 'pwd');
  console.log(res);

  res = await dbm.addConfirmation('hello',
      'confirmation', 'friendRequest', '{id: 2}');
  console.log(res);

  res = await dbm.getConfirmation('hello');
  console.log(res);

  // related query
  res = await dbm.addFriend('hello', 'world');
  console.log(res);

  res = await dbm.getFriends('hello');
  console.log(res);

  res = await dbm.queryUser('hello');
  console.log(res);

  res.accessLevel = 1;
  res.isBlocked= false;
  res.exp = 0;

  res = await dbm.setUser(res);
  console.log(res);

  res = await dbm.queryUser('hello');
  console.log(res);

  // remove waste
  res = await dbm.removeUser('hello');
  console.log(res);

  dbm.destroy();
};

main();
