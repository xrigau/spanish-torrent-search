let T = require('transmission');
let Promise = require('promise');
let fs = require("fs");
let config = JSON.parse(fs.readFileSync("transmission-config.json"));

let transmission = new T({
  host: config.host,
  username: config.username,
  password: config.password
});

var download = function (torrentUrl) {
  return new Promise((resolve, reject) => {
    transmission.addUrl(torrentUrl, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    })
  });
};

module.exports = {
  download
}
