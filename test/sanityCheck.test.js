const {sanityCheck} = require('../lib/lobbyServerNetwork');
const assert = require('assert');

describe('sanityCheck', () => {
  const testFunc = function() {};
  const testUndefined = undefined;
  const illegalString = '!hell';
  const obj = {
    testFunc,
    testUndefined,
    illegalString,
  };

  it('should be illegal', () => {
    assert.equal(sanityCheck(obj), false);
  });


  it('should be legal', () => {
    obj.testFunc = "";
    obj.illegalString = "legal";
    assert.equal(sanityCheck(obj), true);
  });
});
