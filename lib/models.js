/* eslint-disable require-jsdoc */
const {Model} = require('objection');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username'],

      properties: {
        id: {type: 'integer'},
        username: {type: 'string', minLength: 1, maxLength: 255},
        password: {type: 'string', minLength: 1, maxLength: 255},
        accessLevel: {type: 'integer'},
        exp: {type: 'integer'},
        sanity: {type: 'integer'},
        isBlocked: {type: 'boolean'},
      },
    };
  }

  static get relationMappings() {
    return {
      friends: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'users.id',
          through: {
            from: 'friends.userId',
            to: 'friends.friendId',
          },
          to: 'users.id',
        },
      },
      confirmations: {
        relation: Model.HasManyRelation,
        modelClass: Confirmation,
        join: {
          from: 'users.id',
          to: 'confirmations.userId',
        },
      },
    };
  }
}

class Confirmation {
  static get tableName() {
    return 'confirmations';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'text', 'type'],

      properties: {
        id: {type: 'integer'},
        userId: {type: 'integer'},
        type: {type: 'string', minLength: 1, maxLength: 127},
        text: {type: 'string', minLength: 1, maxLength: 255},
        parameters: {type: 'string', minLength: 1, maxLength: 255},
        claimed: {type: 'boolean'},
      },
    };
  }
}

module.exports = {
  User,
  Confirmation,
};
