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
      sendCommand();
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

  command = command || '';
  command = command.trim();

  if (command == '') {
    command = 'cd';
  } else {
    command = command + ' & echo. & cd';
  }

  var postData = JSON.stringify({
    command: command,
    dir: currentDir
  });

  var postOptions = {
    host: host,
    port: port,
    path: '/command',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
    }
  };

  // Set up the request
  var post_req = http.request(postOptions, function (res) {
    var result = '';

    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      chunk = chunk || '';
      result += chunk;
    });

    res.on('end', function () {
      if (res.statusCode != 200) {
        console.error(('Status code - ' + res.statusCode + '\n').red + result);
        process.exit(1);
      }

      try {
        var trimmedResult = result.trim();
        processCommandResult(JSON.parse(trimmedResult));
      }
      catch (e) {
        console.error(result.red);
        process.exit(1);
      }
    });
  });

  post_req.on('error', function (error) {
    console.error(chunk.red);
    process.exit(1);
  });

  // post the data
  post_req.write(postData);
  post_req.end();
}

function processCommandResult(result) {
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
    console.log(output);
  }

  if (result.Error) {
    console.error(result.Error.red);
  }

  currentDir = cd;

  commander.prompt(cd + '> ', sendCommand);
}

exports.main = main;
