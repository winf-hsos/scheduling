/* This section defines what external file / libraries
 * we need for our program.
 */
var log = require('./lib/helper.js').log;
var {
  Workstation
} = require('./lib/Workstation.js');
var {
  Item
} = require('./lib/Item.js');

var itemId = 1;

/* Creates a new workstation. The first parameter is the ID,
 *  the second gives the workstation a name.
 */
var w = new Workstation(1, "A");
w.initialize().then(testWorksation); //.catch(err => console.log("Error in test function: " + err));;


/* Write your test code here */
function testWorksation() {
  log("Test started for: " + w, "info");


  /* Simulate the arrival of a new item */
  immediateArrival(w);

  // Schedule arrivals in the future
  scheduleArrival(w, 15);
  scheduleArrival(w, 25);

}

function immediateArrival(workstation) {
  var item = new Item(itemId++);
  workstation.arriveItem(item);
}

function scheduleArrival(workstation, inSeconds) {
  setTimeout(function() {
    var item = new Item(itemId++);
    workstation.arriveItem(item);
  }, inSeconds * 1000);
}
