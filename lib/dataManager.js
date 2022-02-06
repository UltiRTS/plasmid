const {debug} = require('../config');
const Knex = require('knex');
const {Model} = require('objection');
const {User, Confirmation} = require('./models');
const crypto = require('crypto');

/**
 * @class DataManager
 */
class DataManager {
  /**
   *
   * @param {object} knexConf
   */
  constructor(knexConf) {
    // eslint-disable-next-line new-cap
    this.knex = Knex(knexConf);
    Model.knex(this.knex);
  }

  // usage of transaction not figured out.
  /**
   *
   * @param {String} username
   * @param {String} password
   */
  async register(username, password) {
    const trx = await User.startTransaction();
    let res = 'no';
    try {
      await User.query().insert({
        username: username,
        password: crypto.createHash('md5')
            .update(password + 'salt').digest('hex'),
      });
      await trx.commit();
      res = 'registered';
    } catch (e) {
      res = 'exists';
      await trx.rollback();
      throw e;
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @return {User} user
   */
  async queryUser(username) {
    const user = await User.query().select('*')
        .where('username', '=', username);
    console.log(user);
    return user;
  }
  /**
   *
   * @param {String} username
   * @param {String} password
   */
  async login(username, password) {
    let res = 'no';
    try {
      const user = await this.queryUser(username);
      if (user.password === crypto
          .createHash('md5').update(password+'salt').digest('hex')) {
        res = 'verified';
      };
    } catch (e) {
      res = 'no such user';
      return res;
    }
  }
  /**
   * @function destroy
   */
  destroy() {
    this.knex.destroy();
  }
}

module.exports = {
  DataManager,
};
