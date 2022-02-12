const Knex = require('knex');
const {Model} = require('objection');
const {User, Confirmation, Chat, ChatHistory, Setting} = require('./models');
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
      await User.query(trx).insert({
        username: username,
        password: crypto.createHash('md5')
            .update(password + 'salt').digest('hex'),
      });
      await trx.commit();
      res = 'registered';
    } catch (e) {
      res = 'exists';
      await trx.rollback();
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @return {User} user
   */
  async queryUser(username) {
    const res = await User.query().select('*')
        .where('username', '=', username);
    if (res.length === 0 || !(res[0] instanceof User)) return null;
    return res[0];
  }
  /**
   *
   * @param {String} username
   * @param {String} password
   */
  async login(username, password) {
    let res;
    try {
      const user = await this.queryUser(username);
      if (user &&
        user instanceof User &&
        user.password === crypto
            .createHash('md5')
            .update(password+'salt')
            .digest('hex')) {
        res = 'verified';
      } else {
        res = 'no such user or wrong password';
      }
    } catch (e) {
      res = 'no such user';
    }
    return res;
  }

  // TODO: cascade delelte not working for now
  /**
   *
   * @param {String} username
   * @return {String}
   */
  async removeUser(username) {
    const trx = await User.startTransaction();
    let res;
    try {
      await User.query(trx).delete().where('username', '=', username);
      await trx.commit();
      res = 'removed';
    } catch (e) {
      await trx.rollback();
      res = 'no such user';
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @param {String} friendName
   * @return {String}
   */
  async addFriend(username, friendName) {
    let res;

    const user = await this.queryUser(username);
    const friend = await this.queryUser(friendName);
    if (user === null) res = 'no such user' + username;
    else if (friend === null) res = 'no such user' + friendName;
    else {
      console.log(user);
      console.log(friend);
      const trx = await User.startTransaction();
      try {
        await user.$relatedQuery('friends', trx).relate(friend);
        await trx.commit();
        res = 'added';
      } catch (e) {
        await trx.rollback();
        res = 'already added';
      }
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @param {String} friendName
   * @return {String}
   */
  async removeFriend(username, friendName) {
    let res;

    const user = await this.queryUser(username);
    const friend = await this.queryUser(friendName);
    if (user === null) res = 'no such user' + username;
    else if (friend === null) res = 'no such user' + friendName;
    else {
      console.log(user);
      console.log(friend);
      const trx = await User.startTransaction();
      try {
        await user.$relatedQuery('friends', trx).unrelate(friend);
        await trx.commit();
        res = 'removed';
      } catch (e) {
        await trx.rollback();
        res = 'no such relation';
      }
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @param {String} message
   * @param {String} type
   * @param {String} parameters
   */
  async addConfirmation(username, message, type, parameters) {
    let res;
    const user = await this.queryUser(username);

    const trx = await Confirmation.startTransaction();
    try {
      console.log('querying');
      console.log(user);
      if (user === null) res = 'no such user';
      else {
        console.log('addding');
        await Confirmation.query(trx).insert({
          userId: user.id,
          type: type,
          parameters: parameters,
          text: message,
          claimed: false,
        });
        await trx.commit();
        console.log('added');
        res = 'added';
      }
    } catch (e) {
      await trx.rollback();
      throw (e);
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @return {Confirmation}
   */
  async getConfirmation(username) {
    const user = await this.queryUser(username);
    if (user === null) return null;
    return user.$relatedQuery('confirmations');
  }

  /**
   *
   * @param {String} username
   * @param {String} password
   * @return {String}
   */
  async updatePassword(username, password) {
    const trx = await User.startTransaction();
    try {
      await User.query(trx).updateAndFetchById(username, {
        password: crypto.createHash('md5')
            .update(password + 'salt').digest('hex'),
      });
      await trx.commit();
      return 'updated';
    } catch (e) {
      await trx.rollback();
      return 'no such user';
    }
  }

  /**
   *
   * @param {User} user
   * @return {String}
   */
  async setUser(user) {
    const trx = await User.startTransaction();
    let res;
    try {
      await User.query(trx).updateAndFetchById(user.id, user);
      await trx.commit();
      res = 'udpated';
    } catch (e) {
      await trx.rollback();
      res = 'no such user';
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @return {[User]}
   */
  async getFriends(username) {
    const user = await this.queryUser(username);
    if (user === null) return null;
    return user.$relatedQuery('friends');
  }

  /**
   *
   * @param {String} name
   * @param {String} type
   * @param {String} describe
   * @param {String} password
   * @return {Chat}
   */
  async createChat(name, type, describe, password) {
    const trx = await Chat.startTransaction();
    try {
      const chat = await Chat.query(trx).insert({
        name,
        type,
        describe,
        password,
      });
      trx.commit();
      return chat;
    } catch (e) {
      throw e;
    }
  }

  /**
   *
   * @param {Number} id
   * @return {[ChatHistory]}
   */
  async chatHisotry(id) {
    const chat = await Chat.query().findById(id);
    return chat.$relatedQuery('messages');
  }

  /**
   *
   * @param {Number} chatId
   * @param {Number} userId
   * @param {String} content
   * @param {String} channel
   * @return {ChatHistory}
   */
  async insertMessage(chatId, userId, content, channel) {
    const trx = await ChatHistory.startTransaction();
    try {
      const message = await ChatHistory.query(trx).insert({
        chatId,
        userId,
        content,
        channel,
      });
      trx.commit();
      return message;
    } catch (e) {
      throw e;
    }
  }

  /**
   *
   * @param {String} name
   * @param {String} type
   * @param {String} describe
   * @param {Integer} value
   * @return {Setting}
   */
  async pushSetting(name, type, describe, value) {
    const trx = await Setting.startTransaction();
    try {
      const setting = await Setting.query(trx).insert({
        name,
        type,
        describe,
        value,
      });
      trx.commit();
      return setting;
    } catch (e) {
      throw e;
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
