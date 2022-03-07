/** TEST RELATED CONFIG */
const knexConf = {
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: '/opt/plasmid/test.db',
  },
  pool: {
    afterCreate: (conn, cb) =>
      conn.run('PRAGMA foreign_keys = ON', cb),
  },

};

const dntpServiceHost = 'http://localhost:3000';

/** READ BY THE ACTUAL PROGRAM */
const config={
  autohosts: ['127.0.0.1'],
  // eslint-disable-next-line max-len
  hostileIP: ['444.444.444.444'], // IPs known to cause trouble. do not acess db for this
  port: 9090,
  db: 'sqlite',
};

const debug = true;

module.exports = {
  config,
  knexConf,
  debug,
  dntpServiceHost,
};
