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
          accessLevel=0;
          // client.loggedIn=false
          console.log('client authenticating');
          for (const row of rows) {
            if (row['password']==credentials['passwd']) {
              // get access level
              const accessLevel = row['accessLevel'];

              return [true, accessLevel];
            }
          }
          return [false, accessLevel];
        })
        .catch((err) => {
          console.log(err); throw err;
        });
    /* .finally(() => {
                knex.destroy();
            });*/
  }
}

module.exports=database;
