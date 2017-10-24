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

    this.processingQueue = [];
    this.currentProcessingItem = [];
    this.processingTimespan = {};

    this.arrivalQueue = [];
    this.currentArrivalItem = [];


    this.status = "";
    this.action = "";

    // Listeners
    this.actionChangeListeners = [this.actionChangeHandler];

    /* Create a connection to the workstation's
     * electronic devices
     */
    this.devices = new WorkstationDevices(this);
  }

  /* Initialize the connected electronic devices */
  initialize() {
    var _this = this;
    return this.devices.setup().then(() => {

      // Initialize status and action
      this.setStatus(constants.WORKSTATION_STATUS_IDLE);
      this.setAction(constants.ACTION_NONE);

      // Set both buttons off
      this.devices.resetButtonLEDs();

      // Populate the display with values
      this.devices.updateDisplay();

      // Register change listeners
      this.devices.registerWeightListener(this.weightChangedHandler, this);
      this.devices.registerLeftButtonPressedListener(this.leftButtonPressedHandler, this);

    });
  }


  /* Check if weight and color match the item infos */
  measureCurrentArrivalItem() {
    log("Measuring item: " + this.currentArrivalItem);
    this.setAction(constants.ACTION_MEASURE);

    var colorText = this.devices.colorText;
    var weight = this.devices.weight;
    var _this = this;

    setTimeout(function() {
      if ((_this.devices.weight > 0) && (weight == _this.devices.weight) && (_this.devices.colorText != "") && (colorText == _this.devices.colorText)) {
        _this.setAction(constants.ACTION_MEASURE_WAIT_CONFIRMATION);
        return;
      } else return _this.measureCurrentArrivalItem();
    }, 1000);
  }

  /* The handler for different change events */
  weightChangedHandler(weight, _this) {
    log("Weight changed: " + weight, "debug");

    /* If the weight changes during confirmation phase, go back to
     *  measuring phase */
    if (_this.action == constants.ACTION_MEASURE_WAIT_CONFIRMATION) {
      _this.measureCurrentArrivalItem();
    }

    if (_this.action == constants.ACTION_MEASURE_REMOVE_ITEM) {
      if (weight == 0) {
        _this.devices.singleBeep(250, 4000);
        _this.queueCurrentArrivalItem();
      }
    }

    if (_this.action == constants.ACTION_WAIT && _this.status == constants.WORKSTATION_STATUS_PROCESSING) {
        log("Do not remove item while processing", "error");
    }



  }

  leftButtonPressedHandler(_this) {
    log("Left button pressed!", "debug");

    /* If we are waiting for a confirmation of the currently
     * measured item, save it and queue */
    if (_this.action == constants.ACTION_MEASURE_WAIT_CONFIRMATION) {
      _this.saveItemMeasurements();
      _this.setAction(constants.ACTION_MEASURE_REMOVE_ITEM);
    }

  }

  actionChangeHandler(previousAction, newAction) {
    log("Action changed from >" + previousAction + "< to >" + newAction);

  }

  setStatus(status) {
    this.status = status;

    // Set the status LED
    switch (status) {
      case constants.WORKSTATION_STATUS_IDLE:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_GREEN);
        this.devices.setBuzzerMode(constants.BUZZER_OFF);
        break;
      case constants.WORKSTATION_STATUS_PROCESSING:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_SLOW_BLUE);
        this.devices.setBuzzerMode(constants.BUZZER_SLOW_LOW);
        break;
      case constants.WORKSTATION_STATUS_FAILED:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_FAST_RED);
        break;
      case constants.WORKSTATION_STATUS_SETUP:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_NORMAL_YELLOW);
        break;
      case constants.WORKSTATION_STATUS_ARRIVAL:
        this.devices.setLEDMode(constants.LED_STATUS, constants.LED_WHITE);
        break;
      default:
    }
  }

  setAction(action) {
    if (this.action == action)
      return;

    var previousAction = this.action;
    this.action = action;

    // Set the action LED
    switch (action) {
      case constants.ACTION_NONE:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_OFF);
        break;
      case constants.ACTION_MEASURE:
        // Blink fast green
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_GREEN);
        break;
      case constants.ACTION_MEASURE_WAIT_CONFIRMATION:
        // Activate left button with short beep
        this.devices.singleBeep(250, 4000);
        this.devices.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_ON);
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_GREEN);
        break;
      case constants.ACTION_SETUP:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_YELLOW);
        break;

      default:
        log("Error: Invalid action: " + action, "error");
    }

    this.actionChangeListeners.forEach((listener) => {
      listener(previousAction, action)
    });
  }

  saveItemMeasurements() {
    // Save the color and weight
    this.currentArrivalItem.setColor(this.devices.colorText);
    this.currentArrivalItem.setWeight(this.devices.weight);

    log("Measured item " + this.currentArrivalItem, "success")
  }

  queueCurrentArrivalItem() {
    log("Queueing item: " + this.currentArrivalItem + " at workstation " + this.name);
    this.processingQueue.push(this.currentArrivalItem);
    this.currentArrivalItem = {};

    // Check if there are more arrivals, take the first (FIFO)
    if (this.arrivalQueue.length > 0) {
      this.currentArrivalItem = this.arrivalQueue.shift();
      this.setStatus(constants.WORKSTATION_STATUS_ARRIVAL);
      this.measureCurrentArrivalItem();
    }
    // No more arrivals, check if there are items to process
    else if (this.processingQueue.length > 0) {
      // Take the first (FIFO)
      this.currentProcessingItem = this.processingQueue.shift();
      this.setStatus(constants.WORKSTATION_STATUS_PROCESSING);
      this.processItem();
    }
  }

  arriveItem(item) {
    /* Handle this arrival directly if workstation is idle
     * and there are not other arrivals waiting */
    if (this.status == constants.WORKSTATION_STATUS_IDLE && this.arrivalQueue.length == 0) {
      this.currentArrivalItem = item;
      this.setStatus(constants.WORKSTATION_STATUS_ARRIVAL);
      this.measureCurrentArrivalItem();
    } else
      this.arrivalQueue.push(item);
  }

  finishedProcessing() {
    log("Finished processing item: " + this.currentProcessingItem, "success");

    this.devices.beepNTimes(3000, 75, 75, 3);

    // Any neew arrivals?
    if (this.arrivalQueue.length > 0) {

    } else if (this.processingQueue.length > 0) {

    } else {
      this.setStatus(constants.WORKSTATION_STATUS_IDLE);
    }
  }

  processItem() {
    this.setAction(constants.ACTION_WAIT);
    var processingTimeSeconds = 10;
    log("Process item: " + this.currentProcessingItem);

    var _this = this;
    this.processingTimespan = setTimeout(function() {
      _this.finishedProcessing();
    }, processingTimeSeconds * 1000);

  }

  releaseItem(item) {}

  setup(fromType, toType) {}


  toString() {
    return "Workstation " + this.name + " at >" + this.host + "<";
  }

}

exports.Workstation = Workstation;
