var log = require('../../lib/helper.js').log;
var delay = require('../../lib/helper.js').delay;
var constants = require('./constants.js');
var tinkerforge = require('tinkerforge');


class WorkstationDevices {

  constructor(workstation, host = 'localhost', port = 4223) {
    this.host = host;
    this.port = port;
    this.ipcon = {};
    this.workstation = workstation;

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
    this.colorText = "";

    // Listener
    this.weightListeners = [];
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
          log("Connecting to devices...");
          _this.ipcon.enumerate();

          delay(1000).then(() => {
            log("Waited 1 second");
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
              if (position == "a")
                _this.statusLED = device
              else _this.actionLED = device;
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
              device.on(tinkerforge.BrickletLoadCell.CALLBACK_WEIGHT, function(weight) {
                _this.weight = weight;
                _this.updateDisplay();
                _this.weightListeners.forEach(function(listener) {
                  listener(weight);
                });
              });
              device.getWeight(function(weight) {
                _this.weight = weight;
              });
              _this.loadCell = device;
              break;
            case 230:
              deviceName = "Dual Button Bricklet";
              device = new tinkerforge.BrickletDualButton(uid, _this.ipcon);
              device.on(tinkerforge.BrickletDualButton.CALLBACK_STATE_CHANGED,
                function(buttonL, buttonR, ledL, ledR) {
                  if (buttonL === tinkerforge.BrickletDualButton.BUTTON_STATE_PRESSED) {
                    console.log('Left button pressed');
                  } else {
                    console.log('Left button Released');
                  }
                  if (buttonR === tinkerforge.BrickletDualButton.BUTTON_STATE_PRESSED) {
                    console.log('Right button pressed');
                  } else {
                    console.log('Right button Released');
                  }
                  console.log();
                }
              );
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
                _this.updateDisplay();
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

  resetButtonLEDs() {
    this.dualButton.setLEDState(constants.BUTTON_LED_OFF, constants.BUTTON_LED_OFF);
  }

  // Set the Button LEDs
  setButtonLED(button, what) {
    var _this = this;
    this.dualButton.getLEDState(function(stateLeft, stateRight) {

      console.log("Left: " + stateLeft + ", Right: " + stateRight);

      if (button == constants.BUTTON_LEFT) {
        log("Left: " + what);
        _this.dualButton.setLEDState(what, stateRight);

      } else if (button == constants.BUTTON_RIGHT) {
        log("Right: " + what);
        _this.dualButton.setLEDState(stateLeft, what);
      }

    });
  }

  extractColorFromRGB() {
    if ((this.color.r > this.color.g) && (this.color.r > this.color.b))
      this.colorText = constants.COLOR_RED;
    if ((this.color.g > this.color.r) && (this.color.g > this.color.b))
      this.colorText = constants.COLOR_GREEN;
    if ((this.color.b > this.color.g) && (this.color.b > this.color.r))
      this.colorText = constants.COLOR_BLUE;

    return this.colorText;
  }

  registerWeightListener(callback) {
    this.weightListeners.push(callback);
  }



  /* Set the display to show the necessary information */
  updateDisplay() {
    this.oled.writeLine(0, 0, fillLine('Workstation ID: ' + this.workstation.id));
    this.oled.writeLine(1, 0, fillLine('Status: ' + this.workstation.status));
    this.oled.writeLine(2, 0, fillLine('Queue: ' + this.workstation.queue.length));
    this.oled.writeLine(3, 0, fillLine('Scale: ' + this.weight + " g"));
    this.oled.writeLine(4, 0, fillLine('Color: ' + (this.weight <= 0 ? "-" : this.extractColorFromRGB())));

    function fillLine(value) {
      var result = value;
      for (var i = value.length; i <= 26; i++) {
        result += " ";
      }
      return result;
    }
  }

  setBeepMode(mode) {
    var buzzerInterval = this.piezoSpeakerInterval;
    var buzzerCycle = this.piezoSpeakerCycle;

    clearInterval(buzzerInterval);

    switch (mode) {
      case constants.BUZZER_OFF:
        break;
      case constants.BUZZER_SLOW:
        setBuzzerMode(this.piezoSpeaker, constants.FREQ_MS_SLOW);
        break;
      case constants.BUZZER_NORMAL:
        setBuzzerMode(this.piezoSpeaker, constants.FREQ_MS_NORMAL);
        break;
      case constants.BUZZER_FAST:
        setBuzzerMode(this.piezoSpeaker, constants.FREQ_MS_FAST);
        break;
      default:
        log("Error: Invalid buzzer mode or mode not implemented: " + mode, "error");
    }

    function setBuzzerMode(buzzerObject, frequency) {
      clearInterval(buzzerInterval);
      buzzerInterval = setInterval(() => {
        if (buzzerCycle == constants.BUZZER_CYCLE_OFF)
          buzzerObject.beep(frequency, 4000);
        buzzerCycle = buzzerCycle == constants.BUZZER_CYCLE_ON ? constants.BUZZER_CYCLE_OFF : constants.BUZZER_CYCLE_ON;
      }, frequency);
    }
  }

  setLEDMode(led, mode) {
    // Depending on which led, get the right variables
    var ledObj = (led === constants.LED_STATUS ? this.statusLED : this.actionLED);
    var ledInterval = (led === constants.LED_STATUS ? this.statusLEDInterval : this.actionLEDInterval);
    var ledBlinkingCycle = (led === constants.LED_STATUS ? this.statusLEDCycle : this.actionLEDCycle);

    switch (mode) {
      case constants.LED_OFF:
        ledObj.setRGBValue(0, 0, 0);
        break;
      case constants.LED_GREEN:
        ledObj.setRGBValue(0, 255, 0);
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
      default:
        log("Error: Invalid LED mode or mode not implemented: " + mode, "error");
    }

    function setBlinkingMode(ledObj, r, g, b, frequency) {
      clearInterval(ledInterval);
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
exports.WorkstationDevices = WorkstationDevices;
