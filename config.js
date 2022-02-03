
const knexConf = {
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: 'test.db',
  },
};

const config={
  autohosts: ['127.0.0.1'],
  // eslint-disable-next-line max-len
  hostileIP: ['444.444.444.444'], // IPs known to cause trouble. do not acess db for this
  port: 9090,
};

module.exports = {
  config,
  knexConf,
};
