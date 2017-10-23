var log = require('../lib/helper.js').log;
var constants = require('./devices/constants.js');
var sleep = require('sleep');

var {
  WorkstationDevices
} = require('./devices/WorkstationDevices.js');

class Workstation {

  constructor(id, name, host = 'localhost') {
    this.id = id;
    this.name = name;
    this.host = host;
    this.maxLengthInputQueue = 3;
    this.queue = [];
    this.status = "UNKNOWN";

    /* Create a connection to the workstation's
     * electronic devices
     */
    this.devices = new WorkstationDevices(this);
  }

  /* Initialize the connected electronic devices */
  initialize() {
    var _this = this;
    return this.devices.setup().then(() => {

      // Turn off right LED
      this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_RED);

      this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_SLOW_BLUE);
      this.devices.setBeepMode(constants.BUZZER_FAST);

      //this.devices.actionLED.setRGBValue(0, 0, 0);

      //this.devices.singleBeep(4000);
      //this.devices.beepAndBlinkNTimes(3000, 0, 255, 0, 100, 100, 3);

      /*
      // Beep 5 times
      setTimeout(function() {
        _this.devices.beepNTimes(4000, 200, 200, 5)
      }, 1500);
      */

      // Populate the display with values
      this.devices.updateDisplay();

    });
  }

  setStatus(status) {
    this.status = status;

    // Set the status LED
    switch (status) {
      case 'IDLE':
        this.devices.statusLED.setRGBValue(0, 255, 0);
        break;
      case 'BUSY':
        this.devices.statusLED.setRGBValue(255, 255, 0);
        break;
      default:
    }
  }

  /* Called when the workstation receives a new item */
  receciveItem(item) {
    log("Received item: " + item);
    this.validateItem(item);

  }

  /* Check if weight and color match the item infos */
  validateItem(item) {

  }

  canReceiveItem() {
    return this.inputQueue.length < this.maxLengthInputQueue;
  }

  queueItem(item) {
    log("Item " + item + " queued at workstation " + this.name);
  }

  finishedProcessing() {}

  processItem(item) {}

  releaseItem(item) {}

  setup(fromType, toType) {}


  toString() {
    return "Workstation " + this.name + " at >" + this.host + "<";
  }

}

exports.Workstation = Workstation;
