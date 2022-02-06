const {knexConf} = require('../config');
const {DataManager} = require('../lib/dataManager');
const {User} = require('../lib/models');

const dbm = new DataManager(knexConf);

dbm.register('hello', 'pwd').then((res)=>{
  console.log(res);
}).catch((e)=>{
  console.log(e);
});

dbm.queryUser('hello').then((uesr)=>{
  console.log(User);
});
