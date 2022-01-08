
const config={
  autohosts: ['127.0.0.1'],
  db: 'sqlite',
  // eslint-disable-next-line max-len
  hostileIP: ['444.444.444.444'], // IPs known to cause trouble. do not acess db for this
  port: 9090,
};

module.exports = {
  config,
};
