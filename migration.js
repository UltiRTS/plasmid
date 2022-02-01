const {db} = require('./config');

const Knex = require('knex');

const knex = Knex({
  client: db,
  useNullAsDefault: true,
  connection: {
    filename: 'test.db',
  },
});

async function createSchema() {
  if (await knex.schema.hasTable('users')) {
    return;
  }

  await knex.schema.createTable('users', (table) => {
    table.incremenet('id').primary();
    table.integer('parentId').references('users.id');
  });
}
