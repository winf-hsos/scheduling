/*********************************************************
 * This file is for tinkering with the single IoT devices
 *********************************************************/

/* This section defines what external file / libraries
 * we need for our program. */
var log = require('./lib/helper.js').log;
var {
  DeviceManager
} = require('./lib/DeviceManager.js');

var manager = new DeviceManager('localhost', 4223);

manager.setup().then(testDevices)
  .catch(err => console.log("Error in test function: " + err));

/* Write your test code here */
function testDevices() {

  manager.resetLEDs();
  manager.actionLED.setRGBValue(255, 150, 0);
  manager.statusLED.setRGBValue(255, 0, 0);

  manager.resetButtonLEDs();

  // Listeners
  manager.registerLeftButtonPressedListener(leftButtonPressed);
  manager.registerWeightListener(weightChanged);

  // End program
  process.stdin.once('data', function() {
    process.exit(0);
  });


}

function leftButtonPressed() {
  log("Left button pressed");
}

function weightChanged(newWeight) {
  log("Current weight: " + newWeight)
}
