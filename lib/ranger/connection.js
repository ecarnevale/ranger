var http = require("http"),
    querystring = require("querystring");

/**
 * Returns the base64 encoded string.
 * @param {string} str The string to base64 encode.
 * @return {string} The base64 encoded string.
 */
var base64Encode = function (str) {
  var buffer = new Buffer(str, "utf8");
  return buffer.toString("base64");
};

/**
 * A connection to the campfire server.
 * @constructor
 * @param {string} account The name of the account to connect to.
 * @param {string} token The api token to connect with.
 */
exports.Connection = function (account, token) {
  var authorization = "Basic " + base64Encode(token + ":X");

  /**
   * Performs a request on the connection and streams the results.
   * @param {string} path The path to request.
   * @param {function(net.Stream)} connectionCallback The callback to call with the connection.
   * @param {function(Message)} callback The callback to call with each result.
   */
  this.stream = function (path, connectionCallback, callback) {
    var headers;

    headers = {
      "Authorization": authorization,
      "Host": "streaming.campfirenow.com",
      "Content-Type": "application/json"
    };

    client = http.createClient(443, headers.Host, true);
    request = client.request("GET", path, headers);
    request.on("response", function (response) {
      connectionCallback(response.connection);

      response.on("data", function (chunk) {
        var splitData, i, parsedObj;

        if (chunk.length > 0) {
          splitData = chunk.toString().split("\r");
          for (i = 0; i < splitData.length; i++) {
            parsedObj = null;

            try {
              parsedObj = JSON.parse(splitData[i]);
            } catch (err) {

            }

            if (parsedObj) {
              callback(parsedObj);
            }
          }
        }
      });
    });

    request.end();
  };

  /**
   * Performs a request on the connection.
   * @param {string} method The http request method.
   * @param {string} path The path to request.
   * @param {Object=} body The object to send as the body of the request.
   * @param {function()=} callback The callback to call when the request completes.
   */
  this.request = function (method, path, body, callback) {
    var headers, jsonBody, client, request;

    if (typeof body === "function") {
      callback = body;
      body = null;
    }

    headers = {
      "Authorization": authorization,
      "Host": account + ".campfirenow.com",
      "Content-Type": "application/json"
    };

    if (method === "GET") {
      if (body) {
        path += "?" + querystring.stringify(body);
      }
    } else {
      if (body) {
        jsonBody = JSON.stringify(body);
        headers["Content-Length"] = jsonBody.length;
      } else {
        headers["Content-Length"] = 0;
      }
    }

    client = http.createClient(443, headers.Host, true);
    request = client.request(method, encodeURI(path), headers);
    request.on("response", function (response) {
      var data = "";

      response.on("data", function (chunk) {
        data += chunk;
      });
      response.on("end", function () {
        var parsedObj;

        if (callback) {
          try {
            parsedObj = JSON.parse(data);
          } catch (err) {

          }

          if (parsedObj) {
            callback(parsedObj);
          } else {
            callback();
          }
        }
      });
    });

    if (jsonBody) {
      request.write(jsonBody);
    }

    request.end();
  };

  /**
   * Performs a get request on the specified path.
   * @param {string} path The request path.
   * @param {Object=} params The optional params to append to the request.
   * @param {function()=} callback The optional function to call when the request completes.
   */
  this.get = function (path, params, callback) {
    this.request("GET", path, params, callback);
  };

  /**
   * Performs a post request on the specified path.
   * @param {string} path The request path.
   * @param {Object=} body The body of the request.
   * @param {function()=} callback The function to call when the request completes.
   */
  this.post = function (path, body, callback) {
    this.request("POST", path, body, callback);
  };

  /**
   * Performs a put request on the specified path.
   * @param {string} path The request path.
   * @param {Object=} body The body of the request.
   * @param {function()=} callback The function to call when the request completes.
   */
  this.put = function (path, body, callback) {
    this.request("PUT", path, body, callback);
  };

  /**
   * Performs a delete request on the specified path.
   * @param {string} path The request path.
   * @param {function()=} callback The function to call when the request completes.
   */
  this.del = function (path, callback) {
    this.request("DELETE", path, null, callback);
  };
};
