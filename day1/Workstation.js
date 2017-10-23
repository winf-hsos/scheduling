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
    this.action = constants.ACTION_NONE;

    /* Create a connection to the workstation's
     * electronic devices
     */
    this.devices = new WorkstationDevices(this);
  }

  /* Initialize the connected electronic devices */
  initialize() {
    var _this = this;
    return this.devices.setup().then(() => {

      this.setStatusLED(constants.WORKSTATION_STATUS_IDLE);
      this.setActionLED(constants.ACTION_NONE);
      this.devices.resetButtonLEDs();

      // Populate the display with values
      this.devices.updateDisplay();

    });
  }

  /* Called when the workstation receives a new item */
  receiveItem(item) {
    log("Received item: " + item);
    this.measureItem(item);
  }

  /* Check if weight and color match the item infos */
  measureItem(item) {
    this.devices.registerWeightListener(this.weightChanged);

    log("Measuring item: " + item);
    this.setActionLED(constants.ACTION_MEASURE);

    var colorText = this.devices.colorText;
    var weight = this.devices.weight;
    var _this = this;

    setTimeout(function() {
      if ((_this.devices.weight > 0) && (weight == _this.devices.weight) && (_this.devices.colorText != "") && (colorText == _this.devices.colorText)) {
        // Activate left button with short beep
        _this.devices.singleBeep(250, 4000);
        _this.devices.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_ON);
        return;
      } else return _this.measureItem(item);
    }, 1000);
  }

  weightChanged(weight) {
    if(this.)
    console.log("Weight changed: " + weight);
  }


  setStatusLED(status) {
    this.status = status;

    // Set the status LED
    switch (status) {
      case constants.WORKSTATION_STATUS_IDLE:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_GREEN);
        break;
      case constants.WORKSTATION_STATUS_BUSY:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_SLOW_BLUE);
        break;
      case constants.WORKSTATION_STATUS_FAILED:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_FAST_RED);
        break;
      case constants.WORKSTATION_STATUS_SETUP:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_NORMAL_YELLOW);
        break;
      default:
    }
  }

  setActionLED(action) {
    // Set the action LED
    switch (action) {
      case constants.ACTION_NONE:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_OFF);
        break;
      case constants.ACTION_MEASURE:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_GREEN);
        break;
      case constants.ACTION_SETUP:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_YELLOW);
        break;
      default:
        log("Error: Invalid action: " + action, "error");
    }

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
