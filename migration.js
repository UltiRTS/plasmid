const {dbConfig} = require('./config');
const knexConf = dbConfig[dbConfig.useDB];

const knex = require('knex')(knexConf);
const {DataManager} = require('./lib/dataManager');


/**
 *
 * @return {Promise<void>}
 */
async function createSchema() {
  if (! await knex.schema.hasTable('users')) {
    await knex.schema.createTable('users', (table) => {
      table.increments();
      table.string('username', 255).unique().notNullable();
      table.string('password', 255).notNullable();
      table.tinyint('accessLevel');
      table.integer('exp');
      table.integer('sanity');
      table.boolean('isBlocked');
    });

    console.log('Created users table');

    await knex.schema.createTable('friends', (table) => {
      table.increments();
      table.integer('userId').unsigned().references('users.id')
          .notNullable() .onDelete('CASCADE');
      table.integer('friendId').unsigned().references('users.id')
          .notNullable().onDelete('CASCADE');
    });

    console.log('Created friends table');
  }

  if (! await knex.schema.hasTable('ipHistory')) {
    await knex.schema.createTable('ipHistory', (table) => {
      table.increments();
      table.integer('userId').unsigned().references('users.id')
          .notNullable().onDelete('CASCADE');
      table.string('ip', 255).notNullable();
    });
    console.log('Created ip history table');
  }

  if (! await knex.schema.hasTable('illegalActions')) {
    await knex.schema.createTable('illegalActions', (table) => {
      table.increments();
      table.integer('userId').unsigned()
          .references('users.id').onDelete('CASCADE');
      table.string('type', 255).notNullable();
      table.string('content', 255);
    });
    console.log('Created illegal actions table');
  }

  if (! await knex.schema.hasTable('conformations')) {
    await knex.schema.createTable('confirmations', (table) => {
      table.increments();
      table.integer('userId').unsigned()
          .references('users.id').notNullable().onDelete('CASCADE');
      table.string('type', 255).notNullable();
      table.string('text', 255).notNullable();
      table.string('parameters', 255);
      table.boolean('claimed').notNullable().defaultTo(false);
    });

    console.log('Created confirmations table');
  }
  if (! await knex.schema.hasTable('settings')) {
    await knex.schema.createTable('settings', (table) => {
      table.increments();
      table.string('name', 255).notNullable();
      table.string('type', 255).notNullable();
      table.string('describe', 255).notNullable();
      table.integer('value').notNullable();
    });

    console.log('Created settings table');
  }

  if (! await knex.schema.hasTable('chats')) {
    await knex.schema.createTable('chats', (table) => {
      table.increments();
      table.string('name', 255).notNullable();
      table.string('type', 255).notNullable();
      table.string('describe', 255);
      table.string('password', 255);
    });

    console.log('Created chats table');
  }

  if (! await knex.schema.hasTable('chatHistory')) {
    await knex.schema.createTable('chatHistory', (table) => {
      table.increments();
      table.integer('userId').unsigned().references('users.id')
          .notNullable().onDelete('CASCADE');
      table.integer('chatId').unsigned().references('chats.id')
          .notNullable().onDelete('CASCADE');
      table.string('content', 255).notNullable();
      // ISO String format
      table.string('createAt', 255).notNullable();
    });

    console.log('Created chat history table');
  }
  if (! await knex.schema.hasTable('assets')) {
    await knex.schema.createTable('assets', (table) => {
      table.increments();
      table.string('name').notNullable();
      table.string('uri').notNullable();
      table.string('marketName').notNullable();
      table.integer('value');
      table.integer('ownerId').unsigned().references('users.id')
          .onDelete('CASCADE');
    });
  }

  knex.destroy();

  const dbm = new DataManager(knexConf);
  await dbm.register('root', 'rootpassword');
  await dbm.register('test4', 'testpassword');
  console.log('Registered test4');
  await dbm.register('test', 'testpassword');
  console.log('Registered test');
  await dbm.addConfirmation('test4', '', 'register', '');
  await dbm.addConfirmation('test', '', 'register', '');
  let res = await dbm.confirm('test4', 1);
  console.log(res);
  res = await dbm.confirm('test', 2);
  console.log(res);

  dbm.destroy();
}

createSchema().then(() => {
  knex.destroy();
  console.log('Done');
}).catch((e)=>{
  console.log(e);
});

