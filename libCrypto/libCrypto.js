const CryptoJs = require('crypto-js');

/**
 *
 * @param {String} text
 * @param {String} key
 * @return {String} The encrypted text
 */
function encrypt(text, key) {
  return CryptoJs.AES.encrypt(text, key).toString();
}

/**
 *
 * @param {String} text
 * @param {String} key
 * @return {String} The decrypted text
 */
function decript(text, key) {
  return CryptoJs.AES.decrypt(text, key).toString(CryptoJs.enc.Utf8);
}

module.exports = {
  decript,
  encrypt,
};
