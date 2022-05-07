const {dbConfig} = require('../config');
const {DataManager} = require('../lib/dataManager');

const knexConf = dbConfig[dbConfig.useDB];

const dbm = new DataManager(knexConf);

const main = async () => {
  let res;
  res = await dbm.register('hello', 'pwd');
  console.log(res);
  res = await dbm.register('world', 'pwd');
  console.log(res);

  const userHello = await dbm.queryUser('hello');
  console.log(res);
  res = await dbm.login('hello', 'pwd');
  console.log(res);

  console.log('========== confirmation ===========');
  res = await dbm.addConfirmation('hello',
      'confirmation', 'friendRequest', '{id: 2}');
  console.log(res);

  res = await dbm.getConfirmation('hello');
  console.log(res);

  // related query
  console.log('========== friend ===========');
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

  const testUser = await dbm.queryUser('hello');
  console.log(testUser);

  console.log('========== chat & messages ===========');
  const chat = await dbm.createChat('chatTest', 'bus');
  console.log(chat);

  res = await dbm.insertMessage(chat.id, testUser.id, 'contentTest', 'bus');
  console.log(chat);

  res = await dbm.insertMessage(chat.id, testUser.id, 'another Content', 'bus');
  console.log(chat);

  const chatHistorys = await dbm.chatHisotry(chat.id);
  console.log(chatHistorys);

  console.log('========== settings ==========');
  const setting =
    await dbm.pushSetting('setting1', 'test', 'test setting', 100);
  console.log(setting);

  console.log('========== assets ==========');
  const asset = {
    name: 'test',
    uri: 'test',
    marketName: 'test',
    value: 100,
    ownerId: 1,
  };
  res = await dbm.assetPush(asset);
  console.log(`push asset ${asset.name}: `, res);
  const assets = await dbm.getAssetsByMarketName('test');
  console.log('assets: ', assets);
  res = await dbm.assetTransferTo(1, userHello.id, 1);
  console.log(`transfer asset ${asset.name}: `, res);
  res = await dbm.queryAsset(100);
  if (res) console.log(`query asset ${res.name}: `, res);
  else console.log('query asset failed');

  console.log('========== tidy up ===========');
  // remove waste
  res = await dbm.removeUser('hello');
  console.log(res);
  res = await dbm.removeUser('world');
  console.log(res);

  dbm.destroy();
};

main();
