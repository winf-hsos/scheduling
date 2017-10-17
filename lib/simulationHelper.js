var chalk = require('chalk');

var startTime = new Date();

function log(message, type = "info") {
  if (type == "info") {
    console.log(chalk.dim(timeSinceStart()) + ": " + message)
  }

  if (type == "debug") {
    console.log(chalk.dim(timeSinceStart()) + ": " + message);
  }

  if (type == "warning") {
    console.log(chalk.dim(timeSinceStart()) + ": " + chalk.yellow(message));
  }
}


function timeSinceStart() {
  var now = new Date().getTime();
  var seconds = Math.round((now - startTime.getTime()) / 1000);
  var minutes = seconds > 60 ? Math.floor(seconds / 60) : 0;
  seconds = seconds % 60;
  return (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

exports.log = log;
