/* eslint-disable require-jsdoc */

// var MD5 = require("crypto-js/md5");
// MD5("Message").toString()


class database {
  constructor() {
    if (global.config['isUsingSQLITE']) {
      this.knex = require('knex')({
        client: 'sqlite3',
        connection: () => ({
          filename: './testDB.db',
        }),
      });
    } else {
      this.knex = require('knex')({
        client: 'mysql',
        connection: {
          host: '127.0.0.1',
          port: 3306,
          user: 'your_database_user',
          password: 'your_database_password',
          database: 'myapp_test',
        },
      });
    }
  }

  authenticate(credentials, client) {
    return this.knex
        .from('user')
        .select('*')
        .where('username', '=', credentials['usr'])
        .then((rows) => {
          let accessLevel=0;
          // client.loggedIn=false
          console.log('client authenticating');
          for (const row of rows) {
            if (row['password']==credentials['passwd']) {
              // get access level
              accessLevel = row['accessLevel'];

              console.log('Successfully logined');
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
    return this.knex.from('user').insert({
      username: credentials['usr'],
      password: credentials['passwd'],
      accessLevel: 0,
    }).into('user').then(() => {
      console.log('USER REGISTERED');
      return true;
    }).catch((e)=>{
      console.log('ERROR: ', e);
      return e;
    });
  }
}

module.exports=database;
