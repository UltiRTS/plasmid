const {Reflex} = require('../drivingInterfaces/reflex');
const {dbConfig} = require('../config');
const knexConfig = dbConfig[dbConfig.useDB];
const {DataManager} = require('../lib/dataManager');
const {EventEmitter} = require('events');

const bus = new EventEmitter();
const dbm = new DataManager(knexConfig);
const sharedConfig = {
  somekey: 'somevalue'
}

const reflex = new Reflex(bus, dbm, sharedConfig);