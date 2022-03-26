/* eslint-disable max-len */
const Knex = require('knex');
const {Model} = require('objection');
const {User, Confirmation, Chat, ChatHistory, Setting, IpHistory, IllegalActions} = require('./models');
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
  async register(username, password, accLeve=0) {
    const trx = await User.startTransaction();
    let res = 'no';

    try {
      await User.query(trx).insert({
        username: username,
        password: crypto.createHash('md5')
            .update(password + 'salt').digest('hex'),
        accessLevel: accLeve,
      });
      await trx.commit();
      res = 'registered';
    } catch (e) {
      res = 'exists';
      await trx.rollback();
      console.log(e);
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
        const count = (await user.$relatedQuery('friends', trx)
            .where('friendId', '=', friend.id).count())[0]['count(*)'];
        if (count> 0) throw new Error('already friend');

        await user.$relatedQuery('friends', trx).relate(friend);
        await trx.commit();
        res = 'added';
      } catch (e) {
        console.log(e);
        await trx.rollback();
        res = 'already added';
      }
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
    return user.$relatedQuery('friends').select('username', 'exp');
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
      if (user === null) res = 'no such user';
      else {
        await Confirmation.query(trx).insert({
          userId: user.id,
          type: type,
          parameters: parameters,
          text: message,
          claimed: false,
        });
        await trx.commit();
        res = 'added';
      }
    } catch (e) {
      await trx.rollback();
      res = 'confirmation wrong';
      console.log(e);
    }

    return res;
  }

  /**
   *
   * @param {String} username
   * @param {Int} id if present, return the confirmation with that id
   * @return {Confirmation}
   */
  async getConfirmation(username, id=null) {
    const user = await this.queryUser(username);
    if (user === null) return null;
    if (id === null) return user.$relatedQuery('confirmations').select('*');
    else return user.$relatedQuery('confirmations').where('id', '=', id).select('*');
  }

  /**
   *
   * @param {String} username
   * @return {String}
   */
  async regConfirmed(username) {
    const user = await this.queryUser(username);
    if (user === null) return null;
    const confirmations = await user.$relatedQuery('confirmations')
        .where('type', '=', 'register');
    if (confirmations.length > 0 && confirmations[0].claimed) return true;
    else return false;
  }

  /**
   *
   * @param {String} username
   * @param {Number} confirmationId
   * @return {String}
   */
  async confirm(username, confirmationId) {
    const user = await this.queryUser(username);
    if (user === null) return 'no such user';
    const confirmations = await user.$relatedQuery('confirmations')
        .where('id', '=', confirmationId);
    if (confirmations.length === 0) return 'confirmation not found';

    const trx = await Confirmation.startTransaction();
    try {
      await Confirmation.query(trx).findById(confirmationId)
          .update({
            userId: user.id,
            type: 'register',
            claimed: true,
          });
      await trx.commit();
      return 'yes';
    } catch (e) {
      await trx.rollback();
      return 'confirm failed';
    }
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
      trx.rollback();
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
   * @return {ChatHistory}
   */
  async insertMessage(chatId, userId, content) {
    const trx = await ChatHistory.startTransaction();
    try {
      const message = await ChatHistory.query(trx).insert({
        chatId,
        userId,
        content,
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
   *
   * @param {User} user
   * @param {String} ip
   * @return {String}
   */
  async recordIp(user, ip) {
    const trx = await IpHistory.startTransaction();
    try {
      await IpHistory.query(trx).insert({
        userId: user.id,
        ip,
      });
      await trx.commit();
      return 'ok';
    } catch (e) {
      await trx.rollback();
      console.log(e);
      return 'error';
    }
  }

  /**
   *
   * @param {User} user
   * @param {String} type
   * @param {String} content
   * @return {String}
   */
  async recordIllegalAction(user, type, content) {
    const trx = await IllegalActions.startTransaction();
    try {
      await IllegalActions.query(trx).insert({
        userId: user.id,
        type,
        content,
      });
      await trx.commit();
      return 'ok';
    } catch (e) {
      await trx.rollback();
      console.log(e);
      return 'error';
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
