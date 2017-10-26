var log = require('./lib/helper.js').log;
var timeInSecondsSinceStart = require('./lib/helper.js').timeInSecondsSinceStart;
var constants = require('./lib/constants.js');
var {
  Workstation
} = require('./lib/Workstation.js');
var {
  Item
} = require('./lib/Item.js');

var itemId = 1;
var lastArrivalTime = 0;
var items = [];

/* Creates a new workstation. The first parameter is the ID,
 *  the second gives the workstation a name.
 */
var w = new Workstation(1, "A");
w.initialize().then(startCompetition); //.catch(err => console.log("Error in test function: " + err));;


/* Write your test code here */
function startCompetition() {
  log("Competition started for: " + w, "info");

  // Schedule arrivals in the future
  // scheduleCompetition
  scheduleArrival(w, 5, constants.COLOR_RED);

  setInterval(checkAllFinished, 500);

}

function scheduleCompetition() {
  scheduleArrival(w, 2, constants.COLOR_GREEN);
  scheduleArrival(w, 18, constants.COLOR_BLUE);
  scheduleArrival(w, 10, constants.COLOR_RED);
  scheduleArrival(w, 25, constants.COLOR_GREEN);
  scheduleArrival(w, 17, constants.COLOR_GREEN);
  scheduleArrival(w, 11, constants.COLOR_RED);
  scheduleArrival(w, 22, constants.COLOR_BLUE);
  scheduleArrival(w, 10, constants.COLOR_RED);
  scheduleArrival(w, 41, constants.COLOR_BLUE);
  scheduleArrival(w, 13, constants.COLOR_RED);
}

function scheduleArrival(workstation, inSeconds, color) {
  var item = new Item(itemId++);

  setTimeout(function() {
    item.setColor(color);
    workstation.arriveItem(item);
  }, lastArrivalTime + inSeconds * 1000);

  items.push(item);
  lastArrivalTime = lastArrivalTime + (inSeconds * 1000);
}

function checkAllFinished() {
  var allFinished = true;
  items.forEach(function(item) {
    if (item.finished === false)
      allFinished = false;
  });

  if (allFinished === false)
    return;

  log("Competition is completed! Total time for processing all >" + items.length + "< items was >" + timeInSecondsSinceStart() + "< seconds", "success");
  process.exit(0);
}
