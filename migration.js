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
          .onDelete('cascade');
      table.integer('friendId').references('users.id').notNullable()
          .onDelete('cascade');
    });

    console.log('Created friends table');
  }

  if (! await knex.schema.hasTable('conformations')) {
    await knex.schema.createTable('confirmations', (table) => {
      table.increments();
      table.integer('userId').references('users.id').notNullable();
      table.string('type', 255).notNullable();
      table.string('text', 255).notNullable();
      table.string('parameters', 255);
      table.boolean('claimed').notNullable().defaultTo(false);
    });

    console.log('Created confirmations table');
  }
}

createSchema().then(() => {
  knex.destroy();
  console.log('Done');
});

