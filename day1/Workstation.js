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

    this.status = "";
    this.action = "";

    // Initially the workstation is setup for green
    this.setupForType = constants.COLOR_GREEN;

    this.processingQueue = [];
    this.arrivalQueue = [];
    this.currentArrivalItem = {};
    this.currentProcessingItem = {};

    this.processingTime = 0;
    this.processingStartTime = 0;

    this.setupTime = 0;
    this.setupStartTime = 0

    // The timeout objects for the callback
    this.processingTimespan = {};
    this.setupTimespan = {};

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


  /* The handler for different change events */
  weightChangedHandler(weight, _this) {

    if (weight < 0)
      _this.devices.loadCell.tare();

    /* If the weight changes during confirmation phase, go back to
     *  measuring phase */
    if (_this.action == constants.ACTION_CONFIRM && _this.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      _this.measureItemOnScale();
    }

    if (_this.action == constants.ACTION_REMOVE_ITEM && _this.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      if (weight <= 0) {
        _this.queueCurrentArrivalItem();
      }
    }

    if (_this.action == constants.ACTION_REMOVE_ITEM && _this.status == constants.WORKSTATION_STATUS_PROCESSING) {
      if (weight <= 0) {
        _this.handleProcessing(constants.STEP_PROCESSING_FINISH);
      }
    }

    if (_this.action == constants.ACTION_WAIT && _this.status == constants.WORKSTATION_STATUS_PROCESSING) {
      log("Do not remove item while processing", "error");
    }

  }

  leftButtonPressedHandler(_this) {
    log("Left button pressed!", "debug");

    /* If we were waiting for a confirmation of the currently
     * measured item, save it and queue */
    if (_this.action == constants.ACTION_CONFIRM && _this.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      _this.saveItemMeasurements();
      _this.setAction(constants.ACTION_REMOVE_ITEM);
    }

    /* If we were waiting for a confirmation for setup
     * begin setup */
    if (_this.action == constants.ACTION_CONFIRM && _this.status == constants.WORKSTATION_STATUS_SETUP) {
      _this.handleSetup(constants.STEP_SETUP_START);
    }

    /* If we were waiting for the currently to process item
     * to be put on the scale */
    if (_this.action == constants.ACTION_CONFIRM && _this.status == constants.WORKSTATION_STATUS_PROCESSING) {
      _this.handleProcessing(3);
    }
  }

  actionChangeHandler(previousAction, newAction) {
    log("Action changed from >" + previousAction + "< to >" + newAction + "<");
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

    if (previousAction == constants.ACTION_CONFIRM) {
      this.devices.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_OFF);
    }

    // Set the action LED
    switch (action) {
      case constants.ACTION_NONE:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_OFF);
        break;
      case constants.ACTION_PLACE_ITEM:
        // Blink fast green
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_GREEN);
        break;
      case constants.ACTION_REMOVE_ITEM:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_YELLOW);
        break;
      case constants.ACTION_CONFIRM:
        // Activate left button with short beep
        this.devices.singleBeep(250, constants.SOUND_FREQUENCY_ACTION);
        this.devices.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_ON);
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_GREEN);
        break;
      case constants.ACTION_WAIT:
        this.devices.setLEDMode(constants.LED_ACTION, constants.LED_WHITE);

        if (this.status == constants.WORKSTATION_STATUS_PROCESSING)
          this.devices.setBuzzerMode(constants.BUZZER_SLOW_LOW, constants.SOUND_FREQUENCY_PROCESSING);

        break;

      default:
        log("Error: Invalid action: " + action, "error");
    }

    this.actionChangeListeners.forEach((listener) => {
      listener(previousAction, action)
    });
  }

  arriveItem(item) {
    log(this + ": New item arrived: " + item, "arrival");
    this.handleArrival(constants.STEP_ARRIVAL_CHECK_IMMEDIATE_HANDLING, item);
  }

  /* Check if weight and color match the item infos */
  measureItemOnScale() {
    this.setAction(constants.ACTION_PLACE_ITEM);

    var colorText = this.devices.colorText;
    var weight = this.devices.weight;
    var _this = this;

    setTimeout(function() {
      if ((_this.devices.weight > 0) && (weight == _this.devices.weight) && (_this.devices.colorText != "") && (colorText == _this.devices.colorText)) {
        _this.setAction(constants.ACTION_CONFIRM);
        return;
      } else return _this.measureItemOnScale();
    }, 1000);
  }

  putItemOnScale(expectedItem) {
    console.log(expectedItem);
    this.setAction(constants.ACTION_PLACE_ITEM);

    var colorText = this.devices.colorText;
    var weight = this.devices.weight;
    var _this = this;

    setTimeout(function() {
      if ((_this.devices.weight > 0) && (weight == _this.devices.weight) && (_this.devices.colorText != "") && (colorText == _this.devices.colorText)) {
        // Check if the weight and color match the expectations
        log("Expected: " + expectedItem.weight + ", color: " + expectedItem.color);
        if (weight == expectedItem.weight && colorText == expectedItem.color) {
          log("Item matches expected color and weight!");
          _this.handleProcessing(constants.STEP_PROCESSING_START);
          return;
        } else {
          _this.devices.singleBeep(1000, constants.SOUND_FREQUENCY_ERROR);
          return _this.putItemOnScale(expectedItem);
        }

      } else return _this.putItemOnScale(expectedItem);
    }, 1000);
  }

  saveItemMeasurements() {
    // Save the color and weight
    this.currentArrivalItem.setColor(this.devices.colorText);
    this.currentArrivalItem.setWeight(this.devices.weight);

    log("Measured " + this.currentArrivalItem, "arrival")
  }

  queueCurrentArrivalItem() {
    log("Queueing item: " + this.currentArrivalItem + " at workstation " + this.name);
    this.processingQueue.push(this.currentArrivalItem);
    this.currentArrivalItem = {};

    // Check if there are more arrivals, take the first (FIFO)
    if (this.arrivalQueue.length > 0) {
      this.handleArrival(constants.STEP_ARRIVAL_NEXT_FROM_QUEUE);
    }
    // No more arrivals, check if there are items to process
    else if (this.processingQueue.length > 0) {
      this.handleProcessing(constants.STEP_PROCESSING_CHECK_SETUP);
    }
  }

  processItem() {
    this.setAction(constants.ACTION_WAIT);
    log("Processing " + this.currentProcessingItem, "processing");

    // Calculate the processing time based on weight
    this.processingTime = this.currentProcessingItem.weight * constants.PROCESSING_TIME_PER_GRAM;
    this.processingStartTime = new Date();

    var _this = this;
    this.processingTimespan = setTimeout(function() {
      _this.handleProcessing(constants.STEP_PROCESSING_REMOVE_ITEM_FROM_SCALE);
    }, this.processingTime * 1000);

  }

  finishProcessing() {
    log("Finished processing item: " + this.currentProcessingItem, "processing");
    this.devices.beepNTimes(constants.SOUND_FREQUENCY_PROCESSING, 50, 50, 4);
    // Stop sound interval
    this.devices.setBuzzerMode(constants.BUZZER_OFF);

    // Any new arrivals?
    if (this.arrivalQueue.length > 0) {
      this.handleNextArrival();
    }
    // If no arrivals, any items to process?
    else if (this.processingQueue.length > 0) {
      this.handleProcessing(constants.STEP_PROCESSING_CHECK_SETUP);

    } else {
      log("No more work to do... ");
      this.setStatus(constants.WORKSTATION_STATUS_IDLE);
      this.setAction(constants.ACTION_NONE);
    }
  }

  handleArrival(step, item = null) {
    // Check if this arrival can be handled immediately
    if (step == constants.STEP_ARRIVAL_CHECK_IMMEDIATE_HANDLING) {
      if (this.status == constants.WORKSTATION_STATUS_IDLE && this.arrivalQueue.length == 0) {
        this.currentArrivalItem = item;
        this.handleArrival(constants.STEP_ARRIVAL_MEASURE_ITEM);
      } else
        this.arrivalQueue.push(item);
    }

    if (step == constants.STEP_ARRIVAL_NEXT_FROM_QUEUE) {
      this.currentArrivalItem = this.selectNextArrivalItem();
      this.handleArrival(constants.STEP_ARRIVAL_MEASURE_ITEM);
    }

    if (step == constants.STEP_ARRIVAL_MEASURE_ITEM) {
      this.setStatus(constants.WORKSTATION_STATUS_ARRIVAL);
      log("Measuring item: " + this.currentArrivalItem, "arrival");
      this.measureItemOnScale();
    }
  }

  handleProcessing(step, item = null) {

    /* STEP 1: Identify item and check if setup is necessay */
    if (step == constants.STEP_PROCESSING_CHECK_SETUP) {
      log("Step 1");
      // Identify the item
      var nextColor;
      if (item !== null)
        nextColor = item.color;
      else
        nextColor = this.selectNextProcessingItem(false).color;

      // Check if setup is necessary
      if (this.setupForType != nextColor) {
        this.handleSetup(constants.STEP_SETUP_CONFIRM);
        return;
      } else
        return this.handleProcessing(constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE, item);
    }

    // STEP 2: Possible setup has been done - put item on scale
    if (step == constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE) {
      this.setStatus(constants.WORKSTATION_STATUS_PROCESSING);
      this.setAction(constants.ACTION_PLACE_ITEM);
      this.putItemOnScale(this.selectNextProcessingItem(false));
      return;
    }

    // STEP 3: Start processing
    if (step == constants.STEP_PROCESSING_START) {
      this.currentProcessingItem = this.selectNextProcessingItem();
      this.processItem();
      return;
    }

    // STEP 4: Remove item from scale
    if (step == constants.STEP_PROCESSING_REMOVE_ITEM_FROM_SCALE) {
      this.setAction(constants.ACTION_REMOVE_ITEM);
    }

    // STEP 5: Finish processing
    if (step == constants.STEP_PROCESSING_FINISH) {
      this.finishProcessing();
    }
  }

  handleSetup(step) {
    // STEP 1: Confirm setup by button press
    if (step == constants.STEP_SETUP_CONFIRM) {
      this.setStatus(constants.WORKSTATION_STATUS_SETUP);
      this.setAction(constants.ACTION_CONFIRM);
    }

    // STEP 2: Start setup
    if (step == constants.STEP_SETUP_START) {
      var nextColor = this.selectNextProcessingItem(false).color;
      this.setup(nextColor);
    }

    // STEP 3: Finish setup
    if (step == constants.STEP_SETUP_FINISH) {
      this.finishSetup();
    }
  }

  /* Simple FIFO Queue */
  selectNextArrivalItem() {
    if (this.arrivalQueue.length > 0) {
      return this.arrivalQueue.shift();
    }
  }

  /* Simple FIFO Queue */
  selectNextProcessingItem(takeout = true) {
    if (this.processingQueue.length > 0) {
      if (takeout === true)
        return this.processingQueue.shift();
      else {
        log("Returning first in queue.");
        return this.processingQueue[0];
      }
    }
  }

  releaseItem(item) {}

  setup(toColor) {
    log("Setup up " + this + " to color >" + toColor + "<", "setup");

    this.setAction(constants.ACTION_WAIT);

    this.setupTime = this.calculateSetupTime(toColor);
    this.setupStartTime = new Date();

    var _this = this;
    this.setupTimespan = setTimeout(function() {
      _this.setupForType = toColor;
      _this.handleSetup(constants.STEP_SETUP_FINISH);
    }, this.setupTime * 1000);
  }

  calculateSetupTime(toColor) {
    return 10;
  }

  finishSetup() {
    log("Finished setup to color >" + this.setupForType + "<", "setup");
    this.handleProcessing(constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE);
  }

  toString() {
    return "Workstation >" + this.name + "< at >" + this.host + "<";
  }

}

exports.Workstation = Workstation;
