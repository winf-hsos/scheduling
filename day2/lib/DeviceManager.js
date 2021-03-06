var log = require('./helper.js').log;
var delay = require('./helper.js').delay;
var timeInSecondsSince = require('./helper.js').timeInSecondsSince;
var timeInSecondsSinceStart = require('./helper.js').timeInSecondsSinceStart;
var constants = require('./constants.js');
var tinkerforge = require('tinkerforge');

class DeviceManager {

  constructor(host = 'localhost', port = 4223) {
    this.host = host;
    this.port = port;
    this.ipcon = {};

    // The eletronic devices
    this.statusLED = {};
    this.actionLED = {};
    this.piezoSpeaker = {};
    this.dualButton = {};
    this.loadCell = {};
    this.colorSensor = {};
    this.oled = {};

    // LED fields
    this.statusLEDInterval = setInterval(() => {}, 0);
    this.statusLEDCycle = constants.LED_BLINKING_CYCLE_OFF;

    this.actionLEDInterval = setInterval(() => {}, 0);
    this.actionLEDCycle = constants.LED_BLINKING_CYCLE_OFF;

    this.piezoSpeakerInterval = setInterval(() => {}, 0);
    this.piezoSpeakerCycle = constants.LED_BLINKING_CYCLE_OFF;

    // Sensor values
    this.weight = 0;
    this.color = {};

    // Listeners
    this.weightChangeListeners = [];
    this.colorChangeListeners = [];
    this.leftButtonPressedListeners = [];
    this.rightButtonPressedListeners = [];

    this.leftButtonPressed = false;
    this.rightButtonPressed = false;

    this.positionFirstLED = "";

  }

  registerWeightListener(callback) {
    this.weightChangeListeners.push(callback);
  }

  registerColorListener(callback) {
    this.colorChangeListeners.push(callback);
  }

  registerLeftButtonPressedListener(callback) {
    this.leftButtonPressedListeners.push(callback);
  }

  registerRightButtonPressedListener(callback) {
    this.rightButtonPressedListeners.push(callback);
  }

  _leftButtonChanged(state) {
    if (state === tinkerforge.BrickletDualButton.BUTTON_STATE_PRESSED) {
      this.leftButtonPressed = true;
    } else if (this.leftButtonPressed === true) {
      this.leftButtonPressedListeners.forEach(function(callback) {
        callback();
      });
      this.leftButtonPressed = false;
    }
  }

  _rightButtonChanged(state) {
    if (state === tinkerforge.BrickletDualButton.BUTTON_STATE_PRESSED) {
      this.rightButtonPressed = true;
    } else if (this.rightButtonPressed === true) {
      this.rightButtonPressedListeners.forEach(function(callback) {
        callback();
      });
      this.rightButtonPressed = false;
    }
  }


  setup() {
    return new Promise((resolve, reject) => {
      var _this = this;

      // Create connection and connect to brickd
      this.ipcon = new tinkerforge.IPConnection();
      this.ipcon.connect(this.host, this.port);

      this.ipcon.on(tinkerforge.IPConnection.CALLBACK_CONNECTED,

        function(connectReason) {
          log("Successfully connected to Master Brick on " + _this.host, "success");

          // Trigger Enumerate
          _this.ipcon.enumerate();

          // Wait one second for all devices to connect
          delay(1000).then(() => {
            resolve(_this);
          });

        }
      );

      // Register Enumerate Callback
      this.ipcon.on(tinkerforge.IPConnection.CALLBACK_ENUMERATE,

        // Print incoming enumeration
        function(uid, connectedUid, position, hardwareVersion, firmwareVersion,
          deviceIdentifier, enumerationType) {

          var deviceName;
          var device;

          switch (deviceIdentifier) {
            case 13:
              // Master Brick 2.1
              deviceName = "Master Brick 2.1";
              break;
            case 271:
              deviceName = "RGB LED Bricklet";
              device = new tinkerforge.BrickletRGBLED(uid, _this.ipcon);
              if (_this.positionFirstLED == "") {
                _this.positionFirstLED = position;
                _this.statusLED = device;
              } else if (_this.positionFirstLED <= position) {
                _this.actionLED = device;
              } else {
                _this.actionLED = _this.statusLED;
                _this.statusLED = device;

              }
              break;
            case 242:
              deviceName = "Piezo Speaker Bricklet";
              device = new tinkerforge.BrickletPiezoSpeaker(uid, _this.ipcon);
              _this.piezoSpeaker = device;
              break;
            case 253:
              deviceName = "Load Cell Bricklet";
              device = new tinkerforge.BrickletLoadCell(uid, _this.ipcon);
              device.setWeightCallbackPeriod(500);
              device.tare();
              device.on(tinkerforge.BrickletLoadCell.CALLBACK_WEIGHT, function(weight) {
                _this.weight = weight;
                // Call the listeners about the update
                _this.weightChangeListeners.forEach(function(callback) {
                  callback(weight);
                });
              });
              _this.loadCell = device;
              break;
            case 230:
              deviceName = "Dual Button Bricklet";
              device = new tinkerforge.BrickletDualButton(uid, _this.ipcon);
              device.on(tinkerforge.BrickletDualButton.CALLBACK_STATE_CHANGED,
                function(buttonL, buttonR, ledL, ledR) {
                  _this._leftButtonChanged(buttonL);
                  _this._rightButtonChanged(buttonR);
                });

              _this.dualButton = device;
              break;
            case 243:
              deviceName = "Color Bricklet";
              device = new tinkerforge.BrickletColor(uid, _this.ipcon);
              device.setColorCallbackPeriod(500);
              device.lightOn();
              device.on(tinkerforge.BrickletColor.CALLBACK_COLOR, function(r, g, b, c) {

                _this.color.r = r;
                _this.color.g = g;
                _this.color.b = b;
                _this.color.c = c;

                _this.colorChangeListeners.forEach(function(callback) {
                  callback(_this.color);
                });
              });
              _this.colorSensor = device;
              break;
            case 263:
              deviceName = "OLED 128x64 Bricklet";
              device = new tinkerforge.BrickletOLED128x64(uid, _this.ipcon);
              device.clearDisplay();
              _this.oled = device;
              break;
            default:
              deviceName = "Unknown";
          }

          if (deviceIdentifier != 13)
            log("Found >" + deviceName + " (" + deviceIdentifier + "/" + uid + ")<" + " at Master Brick with UID " + connectedUid + " at position " + position, "success");
          else
            log("Found >" + deviceName + " (" + uid + ")<", "success");
        }
      );

    });
  }

  resetLEDs() {
    this.setLEDMode(constants.LED_ACTION, constants.LED_OFF);
    this.setLEDMode(constants.LED_STATUS, constants.LED_OFF);
  }

  resetDisplay() {
    this.oled.clearDisplay();
  }

  resetButtonLEDs() {
    log("Reset button LEDs", "debug");
    this.setButtonLED(constants.BUTTON_LEFT, constants.BUTTON_LED_OFF);
    this.setButtonLED(constants.BUTTON_RIGHT, constants.BUTTON_LED_OFF);
  }


  // Set the Button LEDs
  setButtonLED(button, what) {
    var _this = this;
    this.dualButton.getLEDState(function(stateLeft, stateRight) {

      if (button == constants.BUTTON_LEFT) {
        _this.dualButton.setLEDState(what, stateRight);

      } else if (button == constants.BUTTON_RIGHT) {
        _this.dualButton.setLEDState(stateLeft, what);
      }

    });
  }

  setBuzzerMode(mode, frequency = 4000) {
    var buzzerInterval = this.piezoSpeakerInterval;
    var buzzerCycle = this.piezoSpeakerCycle;

    clearInterval(buzzerInterval);

    switch (mode) {
      case constants.BUZZER_OFF:
        break;
      case constants.BUZZER_SLOW:
        setMode(this.piezoSpeaker, constants.FREQ_MS_SLOW, frequency);
        break;
      case constants.BUZZER_NORMAL:
        setMode(this.piezoSpeaker, constants.FREQ_MS_NORMAL, frequency);
        break;
      case constants.BUZZER_FAST:
        setMode(this.piezoSpeaker, constants.FREQ_MS_FAST, frequency);
        break;
      case constants.BUZZER_SLOW:
        setMode(this.piezoSpeaker, constants.FREQ_MS_FAST, frequency);
        break;
      default:
        log("Error: Invalid buzzer mode or mode not implemented: " + mode, "error");
    }

    this.piezoSpeakerInterval = buzzerInterval;

    function setMode(buzzerObject, duration, frequency) {
      clearInterval(buzzerInterval);
      buzzerInterval = setInterval(() => {
        if (buzzerCycle == constants.BUZZER_CYCLE_OFF)
          buzzerObject.beep(duration, frequency);
        buzzerCycle = buzzerCycle == constants.BUZZER_CYCLE_ON ? constants.BUZZER_CYCLE_OFF : constants.BUZZER_CYCLE_ON;
      }, frequency);
    }
  }

  setLEDMode(led, mode) {
    // Depending on which led, get the right variables
    var ledObj = (led === constants.LED_STATUS ? this.statusLED : this.actionLED);
    var ledInterval = (led === constants.LED_STATUS ? this.statusLEDInterval : this.actionLEDInterval);
    var ledBlinkingCycle = (led === constants.LED_STATUS ? this.statusLEDCycle : this.actionLEDCycle);

    clearInterval(ledInterval);
    ledObj.setRGBValue(0, 0, 0);

    switch (mode) {
      case constants.LED_OFF:
        ledObj.setRGBValue(0, 0, 0);
        break;
      case constants.LED_GREEN:
        ledObj.setRGBValue(0, 255, 0);
        break;
      case constants.LED_WHITE:
        ledObj.setRGBValue(255, 255, 255);
        break;
      case constants.LED_BLINKING_SLOW_BLUE:
        setBlinkingMode(ledObj, 0, 0, 255, constants.FREQ_MS_SLOW);
        break;
      case constants.LED_BLINKING_NORMAL_YELLOW:
        setBlinkingMode(ledObj, 255, 255, 0, constants.FREQ_MS_NORMAL);
        break;
      case constants.LED_BLINKING_FAST_RED:
        setBlinkingMode(ledObj, 255, 0, 0, constants.FREQ_MS_FAST);
        break;
      case constants.LED_BLINKING_FAST_GREEN:
        setBlinkingMode(ledObj, 0, 255, 0, constants.FREQ_MS_FAST);
        break;
      case constants.LED_BLINKING_FAST_YELLOW:
        setBlinkingMode(ledObj, 255, 255, 0, constants.FREQ_MS_FAST);
        break;
      case constants.LED_BLINKING_FAST_WHITE:
        setBlinkingMode(ledObj, 255, 255, 255, constants.FREQ_MS_FAST);
        break;
      default:
        log("Error: Invalid LED mode or mode not implemented: " + mode, "error");
    }

    // Save the interval timer
    if (led === constants.LED_STATUS)
      this.statusLEDInterval = ledInterval;
    if (led === constants.LED_ACTION)
      this.actionLEDInterval = ledInterval;

    function setBlinkingMode(ledObj, r, g, b, frequency) {

      ledObj.setRGBValue(0, 0, 0);
      ledInterval = setInterval(() => {
        if (ledBlinkingCycle == constants.LED_BLINKING_CYCLE_ON)
          ledObj.setRGBValue(0, 0, 0);
        else
          ledObj.setRGBValue(r, g, b);
        ledBlinkingCycle = ledBlinkingCycle == constants.LED_BLINKING_CYCLE_ON ? constants.LED_BLINKING_CYCLE_OFF : constants.LED_BLINKING_CYCLE_ON;
      }, frequency);

    }

  }

  beepAndBlinkNTimes(frequency, r, g, b, beepLength, breakLength, n) {
    var _this = this;
    var c = 0;

    on();
    setTimeout(off, beepLength);

    function off() {
      _this.actionLED.setRGBValue(0, 0, 0);
      if (c < n)
        setTimeout(on, breakLength);
    }

    function on() {
      _this.actionLED.setRGBValue(r, g, b);
      _this.singleBeep(beepLength, frequency);
      if (c != 0)
        setTimeout(off, beepLength);
      c++;
    }
  }

  beepNTimes(frequency, beepLength, breakLength, n) {
    var _this = this;
    var c = 0;

    on();
    setTimeout(off, beepLength);

    function off() {
      if (c < n)
        setTimeout(on, breakLength);
    }

    function on() {
      _this.singleBeep(beepLength, frequency);
      if (c != 0)
        setTimeout(off, beepLength);
      c++;
    }
  }

  singleBeep(duration, frequency) {
    this.piezoSpeaker.beep(duration, frequency);
  }
}
exports.DeviceManager = DeviceManager;
