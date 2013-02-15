var http = require('http');
var url = require('url');
var colors = require('colors');
var commander = require('commander');

var currentDir = '.';
var host;
var port;
var username;
var password;

function main() {
  /*var commander = require("commander");
  commander.version("0.0.1").usage("[options]").option("-f, --fromDir <dir path>", "Source directory to sync").option("-t, --toDir <dir path>", "Destination directory to sync").option("-n, --nextManifest <manifest file path>", "Next manifest file path").option("-p, --previousManifest [manifest file path]", "Previous manifest file path").option("-i, --ignore [patterns]", "List of files/directories to ignore and not sync, delimited by ;").option("-q, --quiet", "No logging").option("-w, --whatIf", "Only log without actual copy/remove of files").parse(process.argv);
  var commanderValues = commander;
  var fromDir = commanderValues.fromDir;*/

  // https://amitap:iis6!dfu@at.scm.kudu3.antares-test.windows-int.net/at.git

  if (process.argv.length != 3) {
    console.error('Usage: kuduExec [kudu service url (with username)]')
    process.exit(1);
  }

  var inputUrl = url.parse(process.argv[2]);

  host = inputUrl.host;

  if (inputUrl.port) {
    port = inputUrl.port;
  }
  else {
    port = inputUrl.protocol == 'https' ? 443 : 80;
  }

  if (inputUrl.auth) {
    var authIndex = inputUrl.auth.indexOf(':');
    if (authIndex > 0) {
      username = inputUrl.auth.substr(0, authIndex);
      password = inputUrl.auth.substr(authIndex + 1);
    }
    else {
      username = inputUrl.auth;
    }
  }

  askUserName(function () {
    askPassword(function () {
      console.log(('Running kuduExec on ' + host + '\n').yellow);
      sendCommand('');
    });
  });
}

function askUserName(callback) {
  if (!username) {
    commander.prompt('Enter user name: ', function (data) {
      username = data;
      callback();
    });
  }
  else {
    callback();
  }
}

function askPassword(callback) {
  if (!password) {
    commander.password('Enter password: ', '*', function (data) {
      password = data;
      callback();
    });
  }
  else {
    callback();
  }
}

function sendCommand(command) {
  if (command == 'exit') {
    process.exit();
  }

  var post_data = JSON.stringify({
    command: command + ' & cd',
    dir: currentDir
  });

  if (command == '') {
    post_data.command = 'cd';
  }

  var post_options = {
    host: host,
    port: port,
    path: '/command',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': post_data.length,
      'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
    }
  };

  // Set up the request
  var post_req = http.request(post_options, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      try {
        var result = JSON.parse(chunk);
      }
      catch (e) {
        console.error(chunk.red);
        process.exit(1);
      }

      var cd;
      var output;
      var resultOutput = result.Output.trim();

      var cdIndex = resultOutput.lastIndexOf('\r\n');
      if (cdIndex < 0) {
        cd = resultOutput;
      }
      else {
        cd = resultOutput.substr(cdIndex).trim();
        output = resultOutput.substr(0, cdIndex);
      }

      if (output) {
        console.log(output.white);
      }

      if (result.Error) {
        console.error(result.Error.red);
      }

      currentDir = cd;

      commander.prompt(cd + '> ', sendCommand);
    });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
}

exports.main = main;
