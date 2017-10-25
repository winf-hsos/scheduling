/****************************************************************
 * This class manages the logic for the devices of a workstation
 ****************************************************************/
var log = require('./helper.js').log;
var timeInSecondsSince = require('./helper.js').timeInSecondsSince;
var constants = require('./constants.js');
var {
  DeviceManager
} = require('./DeviceManager.js');

class WorkstationDeviceManager {

  constructor(workstation) {

    this.workstation = workstation;
    this.dm = new DeviceManager(workstation.host, workstation.port);

    // Sensor fields
    this.colorText = '';

    // Register change listeners
    this.dm.registerWeightListener(this.weightChanged.bind(this));
    this.dm.registerColorListener(this.colorChanged.bind(this));
    this.dm.registerLeftButtonPressedListener(this.leftButtonPressed.bind(this));

    // Listeners
    this.actionChangeListeners = [this.actionChangeHandler];
  }

  initialize() {
    return this.dm.setup().then(() => {
      log("Initialize worksation device manager...", "debug")

      // Initialize status and action
      this.setStatus(constants.WORKSTATION_STATUS_IDLE);
      this.setAction(constants.ACTION_NONE);

      // Set both buttons off
      this.dm.resetButtonLEDs();

      // Register change listeners
      this.dm.registerWeightListener(this.weightChanged.bind(this));
      this.dm.registerLeftButtonPressedListener(this.leftButtonPressed.bind(this));
      this.dm.registerColorListener(this.colorChanged.bind(this));

      // Update display
      setInterval(() => {
        this.updateDisplay()
      }, 500);

    });
  }

  actionChangeHandler(previousAction, newAction) {
    log("Action changed from >" + previousAction + "< to >" + newAction + "<", "debug");
  }

  weightChanged(newWeight) {
    log("Weight changed: " + newWeight + " g", "debug");

    this.weight = newWeight;

    // If the weight is less than 0, tare scale
    if (newWeight < 0)
      this.dm.loadCell.tare();

    /* If the weight changes during confirmation phase, go back to
     *  measuring phase */
    if (this.workstation.action == constants.ACTION_CONFIRM && this.workstation.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      this.workstation.measureItemOnScale();
    }

    if (this.workstation.action == constants.ACTION_REMOVE_ITEM && this.workstation.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      if (newWeight <= 0) {
        this.workstation.handleArrival(constants.STEP_ARRIVAL_QUEUE);
      }
    }

    if (this.workstation.action == constants.ACTION_REMOVE_ITEM && this.workstation.status == constants.WORKSTATION_STATUS_PROCESSING) {
      if (newWeight <= 0) {
        this.workstation.handleProcessing(constants.STEP_PROCESSING_FINISH);
      }
    }

    if (this.workstation.action == constants.ACTION_WAIT && this.workstation.status == constants.WORKSTATION_STATUS_PROCESSING) {
      log("Do not remove item while processing", "error");
    }
  }

  colorChanged(newColor) {
    this.colorText = this.extractColorFromRGB(newColor);
  }

  leftButtonPressed() {
    log("Left button pressed", "debug");

    /* If we were waiting for a confirmation of the currently
     * measured item, save it and queue */
    if (this.workstation.action == constants.ACTION_CONFIRM && this.workstation.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      this.workstation.handleArrival(constants.STEP_ARRIVAL_SAVE_MEASUREMENT);
    }

    /* If we were waiting for a confirmation for setup
     * begin setup */
    if (this.workstation.action == constants.ACTION_CONFIRM && this.workstation.status == constants.WORKSTATION_STATUS_SETUP) {
      this.workstation.handleSetup(constants.STEP_SETUP_START);
    }

    /* If we were waiting for the currently to process item
     * to be put on the scale */
    if (this.workstation.action == constants.ACTION_CONFIRM && this.workstation.status == constants.WORKSTATION_STATUS_PROCESSING) {
      this.workstation.handleProcessing(constants.STEP_PROCESSING_PUT_ITEM_ON_SCALE);
    }

  }

  extractColorFromRGB(color) {
    var colorText = '-';
    if ((color.r > color.g) && (color.r > color.b))
      colorText = constants.COLOR_RED;
    if ((color.g > color.r) && (color.g > color.b))
      colorText = constants.COLOR_GREEN;
    if ((color.b > color.g) && (color.b > color.r))
      colorText = constants.COLOR_BLUE;
    return colorText;
  }

  buttonSignal() {
    this.dm.singleBeep(250, constants.SOUND_FREQUENCY_ACTION);
  }

  errorSoundSignal() {
    this.dm.singleBeep(500, constants.SOUND_FREQUENCY_ERROR);
  }

  finishedProcessSignal() {
    this.dm.beepNTimes(constants.SOUND_FREQUENCY_SUCCESS, 100, 200, 3)
  }

  finishedSetupSignal() {
    this.dm.beepNTimes(constants.SOUND_FREQUENCY_SUCCESS, 100, 200, 3)
  }

  scaleSuccessSignal() {
    this.dm.beepNTimes(constants.SOUND_FREQUENCY_SUCCESS, 100, 200, 1)
  }

  newArrivalSignal() {
    this.dm.beepNTimes(constants.SOUND_FREQUENCY_SUCCESS, 50, 100, 4)
  }

  updateDisplay() {
    this.dm.oled.writeLine(0, 0, fillLine('Workstation ID: ' + this.workstation.id));

    if (this.workstation.status == constants.WORKSTATION_STATUS_PROCESSING && this.workstation.action == constants.ACTION_WAIT) {
      this.dm.oled.writeLine(1, 0, fillLine('Status: ' + this.workstation.status + " (" + Math.round(timeInSecondsSince(this.workstation.processingStartTime) / this.workstation.processingTime * 100) + "%)"));
    } else if (this.workstation.status == constants.WORKSTATION_STATUS_SETUP && this.workstation.action == constants.ACTION_WAIT) {
      this.dm.oled.writeLine(1, 0, fillLine('Status: ' + this.workstation.status + " (" + Math.round(timeInSecondsSince(this.workstation.setupStartTime) / this.workstation.setupTime * 100) + "%)"));
    } else
      this.dm.oled.writeLine(1, 0, fillLine('Status: ' + this.workstation.status));

    this.dm.oled.writeLine(2, 0, fillLine('Action: ' + this.workstation.action));
    this.dm.oled.writeLine(3, 0, fillLine('Processing Queue: ' + this.workstation.processingQueue.length));
    this.dm.oled.writeLine(4, 0, fillLine('Arrival Queue: ' + this.workstation.arrivalQueue.length));
    this.dm.oled.writeLine(5, 0, fillLine('Scale: ' + this.dm.weight + " g"));
    this.dm.oled.writeLine(6, 0, fillLine('Color: ' + (this.dm.weight <= 0 ? "-" : this.extractColorFromRGB(this.dm.color))));

    if (this.workstation.action == constants.ACTION_CONFIRM && this.workstation.status == constants.WORKSTATION_STATUS_ARRIVAL) {
      this.dm.oled.writeLine(7, 0, fillLine('Please confirm item...'));
    } else if (this.workstation.action == constants.ACTION_CONFIRM && this.workstation.status == constants.WORKSTATION_STATUS_SETUP) {
      this.dm.oled.writeLine(7, 0, fillLine('Press to start setup...'));
    } else if (this.workstation.action == constants.ACTION_PLACE_ITEM) {
      this.dm.oled.writeLine(7, 0, fillLine('Place item on scale...'));
    } else if (this.workstation.action == constants.ACTION_REMOVE_ITEM) {
      this.dm.oled.writeLine(7, 0, fillLine('Remove item from scale...'));
    } else
      this.dm.oled.writeLine(7, 0, fillLine(''));

    function fillLine(value) {
      var result = value;
      for (var i = value.length; i <= 26; i++) {
        result += " ";
      }
      return result;
    }
  }

  setStatus(status) {
    this.workstation.status = status;

    this.dm.setBuzzerMode(constants.BUZZER_OFF);

    // Set the status LED
    switch (status) {
      case constants.WORKSTATION_STATUS_IDLE:
        this.dm.setLEDMode(constants.LED_STATUS, constants.LED_GREEN);
        break;
      case constants.WORKSTATION_STATUS_PROCESSING:
        this.dm.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_SLOW_BLUE);
        break;
      case constants.WORKSTATION_STATUS_FAILED:
        this.dm.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_FAST_RED);
        break;
      case constants.WORKSTATION_STATUS_SETUP:
        this.dm.setLEDMode(constants.LED_STATUS, constants.LED_BLINKING_NORMAL_YELLOW);
        break;
      case constants.WORKSTATION_STATUS_ARRIVAL:
        this.dm.setLEDMode(constants.LED_STATUS, constants.LED_WHITE);
        break;
      default:
    }
  }

  setAction(action) {

    this.dm.setBuzzerMode(constants.BUZZER_OFF);

    if (this.workstation.action == action)
      return;

    var previousAction = this.workstation.action;
    this.workstation.action = action;

    if (previousAction == constants.ACTION_CONFIRM) {
      this.dm.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_OFF);
    }

    // Set the action LED
    switch (action) {
      case constants.ACTION_NONE:
        this.dm.setLEDMode(constants.LED_ACTION, constants.LED_OFF);
        break;
      case constants.ACTION_PLACE_ITEM:
        // Blink fast green
        this.dm.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_GREEN);
        break;
      case constants.ACTION_REMOVE_ITEM:
        this.dm.setLEDMode(constants.LED_ACTION, constants.LED_BLINKING_FAST_YELLOW);
        break;
      case constants.ACTION_CONFIRM:
        // Activate left button with short beep
        this.buttonSignal()
        this.dm.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_ON);
        this.dm.setLEDMode(constants.LED_ACTION, constants.LED_GREEN);
        break;
      case constants.ACTION_WAIT:
        this.dm.setLEDMode(constants.LED_ACTION, constants.LED_WHITE);

        if (this.workstation.status == constants.WORKSTATION_STATUS_PROCESSING)
          this.dm.setBuzzerMode(constants.BUZZER_NORMAL, constants.SOUND_FREQUENCY_PROCESSING);

        if (this.workstation.status == constants.WORKSTATION_STATUS_SETUP)
          this.dm.setBuzzerMode(constants.BUZZER_NORMAL, constants.SOUND_FREQUENCY_SETUP);

        break;

      default:
        log("Error: Invalid action: " + action, "error");
    }

    this.actionChangeListeners.forEach((callback) => {
      callback(previousAction, action)
    });
  }
}

exports.WorkstationDeviceManager = WorkstationDeviceManager;
