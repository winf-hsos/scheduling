var chalk = require('chalk');

var startTime = new Date();

function log(message, type = "info") {
  if (type == "info") {
    console.log(timeSinceStart() + ": " + message)
  }

  if (type == "success") {
    console.log(chalk.green(timeSinceStart() + ": " + message));
  }

  /*
    if (type == "debug") {
      console.log(chalk.yellow(timeSinceStart() + ": " + message));
    }
    */

  if (type == "warning") {
    console.log(chalk.dim(timeSinceStart()) + ": " + chalk.yellow(message));
  }

  if (type == "arrival") {
    console.log(chalk.inverse(timeSinceStart() + ": " + message));
  }

  if (type == "processing") {
    console.log(chalk.bgBlue(timeSinceStart() + ": " + message));
  }

  if (type == "setup") {
    console.log(chalk.bgYellow(timeSinceStart() + ": " + message));
  }

  if (type == "idle") {
    console.log(chalk.bgGreen(timeSinceStart() + ": " + message));
  }
}

// Helper function to give time to enumerate
function delay(t) {
  return new Promise(function(resolve) {
    setTimeout(resolve, t)
  });
}

function timeInSecondsSince(time) {
  var now = new Date().getTime();
  var seconds = Math.round((now - time.getTime()) / 1000);
  return seconds;
}

function timeInSecondsSinceStart() {
  var now = new Date().getTime();
  var seconds = Math.round((now - startTime.getTime()) / 1000);
  return seconds;
}

function timeSinceStart() {
  var now = new Date().getTime();
  var seconds = Math.round((now - startTime.getTime()) / 1000);
  var minutes = seconds > 60 ? Math.floor(seconds / 60) : 0;
  seconds = seconds % 60;
  return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

exports.log = log;
exports.delay = delay;
exports.timeInSecondsSince = timeInSecondsSince;
exports.timeInSecondsSinceStart = timeInSecondsSinceStart;
