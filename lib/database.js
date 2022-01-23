/* eslint-disable max-len */
/* eslint-disable require-jsdoc */

// var MD5 = require("crypto-js/md5");
// MD5("Message").toString()

const crypto = require('crypto');
class database {
  constructor(dbType) {
    switch (dbType) {
      case 'sqlite':
        this.knex = require('knex')({
          client: 'sqlite3',
          connection: () => ({
            filename: './testDB.db',
          }),
        });
        break;
      default:
        break;
    }
  }

  authenticate(credentials) {
    return this.knex
        .from('user')
        .select('*')
        .where('username', '=', credentials['usr'])
        .then((rows) => {
          let accessLevel=0;
          // client.loggedIn=false
          // console.log('client authenticating');
          for (const row of rows) {
            if (row['password']==this.hashPasswd(credentials['passwd'])) {
              // get access level
              accessLevel = row['accessLevel'];

              // console.log('Successfully logined');
              return [true, accessLevel]; // resolve the promise as this
            }
          }
          console.log('Failed to login with', credentials['usr'],
              'password: ', credentials['passwd']);
          return [false, accessLevel]; // resolve the promise as this
        })
        .catch((err) => {
          console.log(err); throw err;
        });
  }

  register(credentials) {
    // eslint-disable-next-line max-len
    const passwdHash=this.hashPasswd(credentials['passwd']);
    return this.knex.from('user').insert({
      username: credentials['usr'],
      password: passwdHash,
      accessLevel: 0,
      exp: 0,
      sanity: 240,
      friends: '',
    }).into('user').then(() => {
      // console.log('USER REGISTERED');
      return [true, 0];
    }).catch((e)=>{
      console.log('ERROR: ', e);
      return [false, 0];
    });
  }

  getSignUpContract() {
    // eslint-disable-next-line max-len
    return this.knex.from('businessSetting').select('*').where('SettingName', '=', 'newUserContract').then((rows) => {
      console.log('db getting user id');
      return rows[0]['SettingValue'];
    },
    ).catch((err) => {
      console.log(err); throw err;
    },
    );
  }

  confirmReg(usr) {
    return this.knex.from('user').update({
      isBlocked: 'no',
    }).where('username', '=', usr).then(() => {
      console.log('db confirming registration');
      return true;
    }).catch((err) => {
      console.log(err); throw err;
    });
  }

  checkBlocked(usr) {
    return this.knex.from('user').select('isBlocked').where('username', '=', usr).then((rows) => {
      return rows[0]['isBlocked'];
    }).catch((err) => {
      console.log(err); throw err;
    });
  }

  checkDup(credentials) {
    return this.knex.from('user').select('*')
        .where('username', '=', credentials['usr'])
        .then((rows) => {
          console.log('client checking dup');
          if (rows.length>0) {
            return true;
          }
          return false;
        })
        .catch((err) => {
          console.log(err); throw err;
        });
  }

  getAllFreunds(usr) {
    return this.knex.from('user').select('friends').
        where('username', '=', usr).then((rows) => {
          console.log('db getting all friends');
          return JSON.parse(rows[0]['friends']);
        }).catch((err) => {
          console.log(err); throw err;
        });
  }

  insertFreund(usr, freund) {
    this.getAllFreunds(usr).then((friends) => {
      friends.push(freund);
      return this.knex.from('user').update({
        friends: JSON.stringify(friends),
      }).where('username', '=', usr).then(() => {
        return friends;
      }).catch((err) => {
        console.log(err); throw err;
      });
    }).catch((err) => {
      console.log(err); throw err;
    });
  }

  getUserID(usr) {
    return this.knex.from('user').select('uid').
        where('username', '=', usr).then((rows) => {
          // console.log('db getting user id');
          return rows[0]['uid'];
        }).catch((err) => {
          console.log(err); throw err;
        });
  }

  getAllNotifications(usrID) {
    return this.knex.from('systemConfirmation').select('*').
        where('userID', '=', usrID).then((rows) => {
          // console.log('db getting all notifications'+rows);
          return rows;
        }).catch((err) => {
          console.log(err); throw err;
        });
  }

  writeNotification(usrID, isClaimed, confirmationType, ConfirmationTexts,
      additionalParameters) {
    return this.knex.from('systemConfirmation').insert({
      userID: usrID,
      isClaimed: isClaimed,
      confirmationType: confirmationType,
      ConfirmationTexts: ConfirmationTexts,
      additionalParameters: JSON.stringify(additionalParameters),
    }).into('systemConfirmation').then(() => {
      // console.log('db writing notification');
      return true;
    }).catch((err) => {
      console.log(err); throw err;
    });
  }

  confirmSysMsg(idtoconfirm, usrID, AcceptNum) {
    return this.knex.from('systemConfirmation').update({
      isClaimed: parseInt(AcceptNum),
    }).where('id', '=', idtoconfirm).where('userID', '=', usrID).then(() => {
      this.knex.from('systemConfirmation')
          .where('id', '=', idtoconfirm).where('userID', '=', usrID)
          .select('*').then((rows) => {
            // console.log('db getting user id');
            return rows[0];
          }).catch((err) => {
            console.log(err); throw err;
          });
    });
  }

  checkSysMsgStatus(idtoconfirm, usrID) {
    return this.knex.from('systemConfirmation').select('*').
        where('id', '=', idtoconfirm).
        where('userID', '=', usrID).then((rows) => {
          return rows[0]['isClaimed'];
        }).catch((err) => {
          console.log(err); throw err;
        });
  }

  /* chat related db */
  recordChatHistory(usrID, msgChannel, msgContent) {
    const currentTime = new Date();
    const time = currentTime.getTime();
    return this.knex.from('chatsHistory').insert({
      msgAuthor: usrID,
      msgChannel: msgChannel,
      msgContent: msgContent,
      msgDateTime: time,
    }).into('chatsHistory').then(() => {
      // console.log('db recording chat history');
      return true;
    }).catch((err) => {
      console.log(err); throw err;
    });
  }

  getChatTypePasswordDescription(chatName) {
    return this.knex.from('chatsDefinition').select('*').
        where('chatName', '=', chatName).then((rows) => {
          return rows[0];
        }).catch((err) => {
          console.log(err); throw err;
        });
  }

  hashPasswd(passwd) {
    return crypto.createHash('md5')
        .update(passwd+'aSmolAmountofSalt')
        .digest('hex');
  }
}

module.exports=database;
