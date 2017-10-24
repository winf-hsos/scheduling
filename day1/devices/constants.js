module.exports = {

  /* LED Constants */
  LED_STATUS: 'STATUS',
  LED_ACTION: 'ACTION',

  LED_BLINKING_CYCLE_OFF: 0,
  LED_BLINKING_CYCLE_ON: 1,

  /* LED Mode Constants */
  LED_OFF: 0,
  LED_GREEN: 1,
  LED_BLUE: 2,
  LED_RED: 3,
  LED_YELLOW: 4,
  LED_WHITE: 5,

  LED_BLINKING_SLOW_GREEN: 11,
  LED_BLINKING_SLOW_BLUE: 12,
  LED_BLINKING_SLOW_RED: 13,
  LED_BLINKING_SLOW_YELLOW: 14,

  LED_BLINKING_NORMAL_GREEN: 21,
  LED_BLINKING_NORMAL_BLUE: 22,
  LED_BLINKING_NORMAL_RED: 23,
  LED_BLINKING_NORMAL_YELLOW: 24,

  LED_BLINKING_FAST_GREEN: 31,
  LED_BLINKING_FAST_BLUE: 32,
  LED_BLINKING_FAST_RED: 33,
  LED_BLINKING_FAST_YELLOW: 34,
  LED_BLINKING_FAST_WHITE: 35,

  BUZZER_OFF: 100,
  BUZZER_SLOW: 101,
  BUZZER_SLOW_LOW: 102,
  BUZZER_NORMAL: 103,
  BUZZER_FAST: 104,

  BUZZER_CYCLE_OFF: 0,
  BUZZER_CYCLE_ON: 1,

  FREQ_MS_SLOW: 1000,
  FREQ_MS_NORMAL: 500,
  FREQ_MS_FAST: 200,

  SOUND_FREQUENCY_PROCESSING: 600,
  SOUND_FREQUENCY_ACTION: 3000,
  SOUND_FREQUENCY_SUCCESS: 4000,
  SOUND_FREQUENCY_ERROR: 600,

  COLOR_RED: 'RED',
  COLOR_GREEN: 'GREEN',
  COLOR_BLUE: 'BLUE',

  // Workstation status
  WORKSTATION_STATUS_IDLE: 'IDLE', // LED GREEN
  WORKSTATION_STATUS_PROCESSING: 'PROCESSING', // LED BLINKING BLUE
  WORKSTATION_STATUS_SETUP: 'SETUP', // LED BLINKING YELLOW
  WORKSTATION_STATUS_FAILED: 'FAILED', // LED BLINKIN FAST RED
  WORKSTATION_STATUS_ARRIVAL: 'ARRIVAL', // LED BLINKING WHITE

  // Actions
  ACTION_NONE: 'NONE',
  ACTION_PLACE_ITEM: 'PLACE ITEM',
  ACTION_CONFIRM: 'CONFIRM',
  ACTION_REMOVE_ITEM: 'REMOVE ITEM',
  ACTION_WAIT: 'WAIT',

  BUTTON_LEFT: 'LEFT',
  BUTTON_RIGHT: 'RIGHT',
  BUTTON_LED_ON: 2,
  BUTTON_LED_OFF: 3,

  PROCESSING_TIME_PER_GRAM: 2,

  STEP_ARRIVAL_CHECK_IMMEDIATE_HANDLING: 1,
  STEP_ARRIVAL_NEXT_FROM_QUEUE: 2,
  STEP_ARRIVAL_MEASURE_ITEM: 3,


  STEP_PROCESSING_CHECK_SETUP: 1,
  STEP_PROCESSING_PUT_ITEM_ON_SCALE: 2,
  STEP_PROCESSING_START: 3,
  STEP_PROCESSING_REMOVE_ITEM_FROM_SCALE: 4,
  STEP_PROCESSING_FINISH: 5,

  STEP_SETUP_CONFIRM: 1,
  STEP_SETUP_START: 2,
  STEP_SETUP_FINISH: 3

}
