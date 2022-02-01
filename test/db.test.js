const Database = require('../lib/database');
const assert = require('assert');


describe('database check', ()=> {
  const db = new Database('sqlite');
  describe('block check', ()=>{
    it('should not be block', async ()=>{
      const res = await db.checkBlocked('test');
      assert.equal(res, 'no');
    });
  });
});

