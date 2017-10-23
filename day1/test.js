/* This section defines what external file / libraries
 * we need for our program.
 */
var log = require('../lib/helper.js').log;
var {
  Workstation
} = require('./Workstation.js');
var {
  Item
} = require('./Item.js');

/* Creates a new workstation. The first parameter is the ID,
 *  the second gives the workstation a name.
 */
var w = new Workstation(1, "Station A");
w.initialize().then(testWorksation).catch(err => console.log("Error in test function: " + err));;


/* Write your test code here */
function testWorksation() {
  log("Test started for:");

  /* Print info about the workstation */
  log(w);

  /* Simulate the arrival of a new item */
  var item = new Item(1);
  w.receiveItem(item);



}
