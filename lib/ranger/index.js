var Client = require("./client").Client;

exports.version = "0.1.2";

/**
 * Returns a campfire client.
 * @constructor
 * @param {string} account The name of the account to connect to.
 * @param {string} token The api token to connect with.
 */
exports.createClient = function (account, token) {
  return new Client(account, token);
};
