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

  /* Calls toString() on the workstation, which prints the info
   * about the workstation to the screen.
   */
  log(w);

  // Write something on the OLED screen
  w.devices.oled.writeLine(0, 0, 'Workstation ID: ' +  w.id);
  w.setStatus("BUSY");

  /* Simulate the arrival of a new item */
  var item = new Item(1);
  item.setType("Blue");
  item.setWeight(9);

  w.receciveItem(item)


}
