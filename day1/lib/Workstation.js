var log = require('./helper.js').log;
var constants = require('./constants.js');

var {
  WorkstationDeviceManager
} = require('./WorkstationDeviceManager.js');

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

    /* Create a manager to interact with the electronic
     * devices and implement the logic of the workstation
     */
    this.wdm = new WorkstationDeviceManager(this);
  }

  /* Initialize device manager and connect to electronic devices */
  initialize() {
    return this.wdm.initialize();
  }

  // Exposed function to receive new arrivals
  arriveItem(item) {
    log(this + ": New item arrived: " + item, "arrival");
    this.wdm.newArrivalSignal();
    this.handleArrival(constants.STEP_ARRIVAL_CHECK_IMMEDIATE_HANDLING, item);
  }

  /**** FUNCTIONS FOR ARRIVAL PROCESS ****/
  handleArrival(step, item = null) {
    // Check if this arrival can be handled immediately
    if (step == constants.STEP_ARRIVAL_CHECK_IMMEDIATE_HANDLING) {
      if (this.status == constants.WORKSTATION_STATUS_IDLE && this.arrivalQueue.length == 0) {
        this.currentArrivalItem = item;
        this.handleArrival(constants.STEP_ARRIVAL_MEASURE_ITEM);
      } else {
        /* TODO: Implement adding the item to the arrival queue */
        log("WARNING: Missing implementation for adding arrival items to queue!", "exercise");
      }
      return;
    }

    // Get next item from arrival queue
    if (step == constants.STEP_ARRIVAL_NEXT_FROM_QUEUE) {
      this.currentArrivalItem = this.selectNextArrivalItem();
      this.handleArrival(constants.STEP_ARRIVAL_MEASURE_ITEM);
      return;
    }

    // Measure item on scale
    if (step == constants.STEP_ARRIVAL_MEASURE_ITEM) {
      this.wdm.setStatus(constants.WORKSTATION_STATUS_ARRIVAL);
      log("Please put " + this.currentArrivalItem + " onto scale for measurement!", "arrival");
      this.measureItemOnScale();
      return;
    }

    // Confirm measurement
    if (step == constants.STEP_ARRIVAL_CONFIRM_MEASUREMENT) {
      log("Please confirm item measurement: Color: " + item.c + ", Weight: " + item.w, "arrival");
      this.wdm.setAction(constants.ACTION_CONFIRM);
      return;
    }

    // Save measurement
    if (step == constants.STEP_ARRIVAL_SAVE_MEASUREMENT) {
      this.saveItemMeasurements();
      log("Please remove item from scale!", "arrival");
      this.wdm.setAction(constants.ACTION_REMOVE_ITEM);
      return;
    }

    if (step == constants.STEP_ARRIVAL_QUEUE) {
      this.putArrivalInProcessingQueue();
      return;
    }
  }

  /* Simple FIFO Queue */
  selectNextArrivalItem() {
    /* TODO: Implement this function such that it reflects
     * a FIFO queue
     *
     * HINT 1: The queue is a field of the Workstation
     *
     * HINT 2: Look at the type of the field */
    log("WARNING: Missing implementation for selecting next item from arrival queue.", "exercise");
    return null;
  }

  putItemOnScale(expectedItem) {
    this.wdm.setAction(constants.ACTION_PLACE_ITEM);

    var colorText = this.wdm.colorText;
    var weight = this.wdm.weight;
    var _this = this;

    setTimeout(function() {
      if ((_this.wdm.weight > 0) && (weight == _this.wdm.weight) && (_this.wdm.colorText != "") && (colorText == _this.wdm.colorText)) {
        // Check if the weight and color match the expectations
        log("Expected: " + expectedItem.weight + ", color: " + expectedItem.color, "debug");
        if (weight == expectedItem.weight && colorText == expectedItem.color) {
          log("Item matches expected color and weight!", "debug");
          _this.wdm.scaleSuccessSignal();
          _this.handleProcessing(constants.STEP_PROCESSING_START);
          return;
        } else {
          log("Wrong item or item not recognized!", "processing");
          _this.wdm.errorSoundSignal();
          return _this.putItemOnScale(expectedItem);
        }

      } else return _this.putItemOnScale(expectedItem);
    }, 1000);
  }

  /* Check if weight and color match the item infos */
  measureItemOnScale() {
    this.wdm.setAction(constants.ACTION_PLACE_ITEM);

    var colorText = this.wdm.colorText;
    var weight = this.wdm.weight;
    var _this = this;

    setTimeout(function() {
      if ((_this.wdm.weight > 0) && (weight == _this.wdm.weight) && (_this.wdm.colorText != "") && (colorText == _this.wdm.colorText)) {
        _this.handleArrival(constants.STEP_ARRIVAL_CONFIRM_MEASUREMENT, {
          w: weight,
          c: colorText
        });
        return;
      } else return _this.measureItemOnScale();
    }, 1000);
  }

  saveItemMeasurements() {
    // Save the color and weight

    /* TODO: Implement saving the color and weight for the
     * measured item.
     *
     * HINT 1: the current arrival item is stored
     * in the variable this.currentArrivalItem.
     *
     * HINT 2: The current color and weight can be retrieved
     * from the WorkstationDeviceManager object */

    log("WARNING: Missing implementation for saving color and weight for the measured item.", "exercise");

    // log("Measured and saved: " + this.currentArrivalItem, "arrival")
  }

  putArrivalInProcessingQueue() {
    log("Queueing item: " + this.currentArrivalItem + " at workstation " + this.name, "arrival");
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

  /**** FUNCTIONS FOR PROCESSING PROCESS ****/
  handleProcessing(step, item = null) {

    /* STEP 1: Identify item and check if setup is necessay */
    if (step == constants.STEP_PROCESSING_CHECK_SETUP) {
      // Identify the item
      var nextColor;
      if (item !== null)
        nextColor = item.color;
      else
        nextColor = this.selectNextProcessingItem(false).color;

      // Check if setup is necessary
      if (this.setupForType != nextColor) {
        log("Setup from >" + this.setupForType + "< to >" + nextColor + "< necessary.", "setup");
        this.handleSetup(constants.STEP_SETUP_CONFIRM);
        return;
      } else
        return this.handleProcessing(constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE, item);
    }

    // STEP 2: Possible setup has been done - put item on scale
    if (step == constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE) {
      this.wdm.setStatus(constants.WORKSTATION_STATUS_PROCESSING);
      this.wdm.setAction(constants.ACTION_PLACE_ITEM);
      var nextItem = this.selectNextProcessingItem(false);
      log("Please put item " + nextItem + " onto the scale.", "processing");
      this.putItemOnScale(nextItem);
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
      log("Please remove item from scale!", "processing");
      this.wdm.setAction(constants.ACTION_REMOVE_ITEM);
    }

    // STEP 5: Finish processing
    if (step == constants.STEP_PROCESSING_FINISH) {
      this.finishProcessing();
    }
  }

  processItem() {
    this.wdm.setAction(constants.ACTION_WAIT);
    log("Processing " + this.currentProcessingItem, "processing");

    /* TODO: Complete the statement below to calculate the
     *  processing time based on the weight of the item
     *
     *  HINT: Look in the constants.js for a hint
     *
     *  // Calculate the processing time based on weight
     *  //this.processingTime = ...
     */
    log("WARNING: Missing implementation for calculating the processing time.");

    this.processingStartTime = new Date();

    var _this = this;
    this.processingTimespan = setTimeout(function() {
      _this.wdm.finishedProcessSignal();
      _this.handleProcessing(constants.STEP_PROCESSING_REMOVE_ITEM_FROM_SCALE);
    }, this.processingTime * 1000);
  }

  finishProcessing() {
    log("Finished processing item: " + this.currentProcessingItem, "processing");

    /* TODO: Implement IF-statement to check whether there
     * are any items in the arrival queue.
     *
     * // Any new arrivals?
     * if (...) {
     *   this.handleArrival(constants.STEP_ARRIVAL_NEXT_FROM_QUEUE);
     * }
     */
    log("WARNING: Missing implementation to check if there are any arrivals after processing finished.", "exercise");

    // If no arrivals, any items to process?
    else if (this.processingQueue.length > 0) {
      this.handleProcessing(constants.STEP_PROCESSING_CHECK_SETUP);

    } else {

      /* TODO: Implement the logic to set the workstation into
       * IDLE and no action.
       *
       * HINT: The require functions are handled by the WorkstationDeviceManager
       *
       * log("No more work to do... ", "idle");
       */
      log("WARNING: Missing implementation to set the workstation into IDLE status.", "exercise");
    }
  }

  /* Simple FIFO Queue */
  selectNextProcessingItem(takeout = true) {
    if (this.processingQueue.length > 0) {
      if (takeout === true)
        return this.processingQueue.shift();
      else {
        log("Returning first in queue.", "debug");
        return this.processingQueue[0];
      }
    }
  }

  /**** FUNCTIONS FOR PROCESSING PROCESS ****/
  handleSetup(step) {
    // STEP 1: Confirm setup by button press
    if (step == constants.STEP_SETUP_CONFIRM) {
      this.wdm.setStatus(constants.WORKSTATION_STATUS_SETUP);
      this.wdm.setAction(constants.ACTION_CONFIRM);
      log("Please confirm to start setup process.", "setup");
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

  setup(toColor) {
    log("Setup up " + this + " to color >" + toColor + "<", "setup");

    this.wdm.setAction(constants.ACTION_WAIT);

    this.setupTime = this.calculateSetupTime(toColor);
    this.setupStartTime = new Date();

    var _this = this;
    this.setupTimespan = setTimeout(function() {
      _this.setupForType = toColor;
      _this.wdm.finishedSetupSignal();
      _this.handleSetup(constants.STEP_SETUP_FINISH);
    }, this.setupTime * 1000);
  }

  finishSetup() {
    log("Finished setup to color >" + this.setupForType + "<", "setup");
    this.handleProcessing(constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE);
  }

  calculateSetupTime(toColor) {
    /* TODO: Calculate the processing time using the following rules
     *
     * From BLUE to GREEN (and vice versa): 10 seconds
     * FROM BLUE to RED (and vice versa): 15 seconds
     * FROM GREEN to RED: 20 seconds
     * FROM RED to GREEN: 10 seconds
     */
    log("WARNING: Missing implementation to calculate setup time!");
  }

  /**** FUNCTIONS FOR RELEASE PROCESS ****/
  releaseItem(item) {}

  // Helper function for printing the workstation
  toString() {
    return "Workstation >" + this.name + "< at >" + this.host + "<";
  }

}

exports.Workstation = Workstation;
