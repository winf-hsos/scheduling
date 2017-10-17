"use strict";
var {
  Controller
} = require('./lib/Controller.js');
var {
  Workstation
} = require('./lib/Workstation.js');
var log = require('./lib/simulationHelper.js').log;
var startTime = require('./lib/simulationHelper.js').startTime;

var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
// Check every 5 seconds if a release should happen
rule.second = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];


// Setup the controller with all workstations and orders
var c = new Controller();
var checkReleaseJob;

c.init().then(start).catch(err => console.log("Error running simulation: " + err));

function start() {

  var checkReleaseJob = schedule.scheduleJob(rule, function() {
    log("Check release");
    c.checkRelease();
  });

  //j.cancel();
}
