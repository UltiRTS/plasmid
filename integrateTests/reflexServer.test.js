const {DevPortalDriver} = require('../drivingInterfaces/devPortalDriver');
const {dbConfig} = require('../config');
const knexConfig = dbConfig[dbConfig.useDB];
const {DataManager} = require('../lib/dataManager');
const {EventEmitter} = require('events');

const bus = new EventEmitter();
const dbm = new DataManager(knexConfig);
const sharedConfig = {
  somekey: 'somevalue'
}

const devPortalDriver = new DevPortalDriver(bus, dbm, sharedConfig, {
  port: 10999,
  invite_token: 'token'
});