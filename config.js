/** TEST RELATED CONFIG */
const dbConfig = {
  'useDB': 'sqlite3',
  'sqlite3': {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: './test.db',
    },
    pool: {
      afterCreate: (conn, cb) =>
        conn.run('PRAGMA foreign_keys = ON', cb),
    },
  },
  'mysql': {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'username',
      password: 'password',
      database: 'database_name',
    },
  },
};

const dntpServiceHost = 'http://localhost:3000';

/** READ BY THE ACTUAL PROGRAM */
const config = {
  autohosts: ['127.0.0.1'],
  // eslint-disable-next-line max-len
  hostileIP: ['444.444.444.444'], // IPs known to cause trouble. do not acess db for this
  selfIP: '178.18.243.134', // IP of plasmid
  port: 9090,
};

const debug = true;
const bridgeUsername = 'Thea, Inc. signalCascade';
const discordToken = '';
const ircServer = {
  addr: '185.205.246.232',
  port: 6667
}

module.exports = {
  config,
  dbConfig,
  debug,
  dntpServiceHost,
  discordToken,
  ircServer,
  bridgeUsername,
};
