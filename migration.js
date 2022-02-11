const {knexConf} = require('./config');
const knex = require('knex')(knexConf);

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
      table.integer('userId').references('users.id').notNullable()
          .onDelete('CASCADE');
      table.integer('friendId').references('users.id').notNullable()
          .onDelete('CASCADE');
    });

    console.log('Created friends table');
  }

  if (! await knex.schema.hasTable('conformations')) {
    await knex.schema.createTable('confirmations', (table) => {
      table.increments();
      table.integer('userId').references('users.id')
          .notNullable().onDelete('CASCADE');
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
      table.integer('userId').references('users.id')
          .notNullable().onDelete('CASCADE');
      table.integer('chatId').references('chats.id')
          .notNullable().onDelete('CASCADE');
      table.string('channel', 255).notNullable();
      table.string('content', 255).notNullable();
      // ISO String format
      table.string('createAt', 255).notNullable();
    });

    console.log('Created chat history table');
  }
}

createSchema().then(() => {
  knex.destroy();
  console.log('Done');
});

