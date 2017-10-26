var log = require('./helper.js').log;
var timeInSecondsBetween = require('./helper.js').timeInSecondsBetween;

class Item {

  constructor(id) {
    this.id = id;
    this.arrivalTime = {};
    this.leaveSystemTime = {};
    this.processingStartTime = {};
    this.processingEndTime = {};
    this.processingDuration = -1;
    this.cycleTime = -1;
    this.finished = false;
  }

  arrive() {
    this.arrivalTime = new Date();
  }

  startProcessing() {
    this.processingStartTime = new Date();
  }

  endProcessing() {
    this.processingEndTime = new Date();
    this.processingDuration = timeInSecondsBetween(this.processingStartTime, this.processingEndTime);
  }

  leave() {
    this.leaveSystemTime = new Date();
    this.cycleTime = timeInSecondsBetween(this.arrivalTime, this.leaveSystemTime);
    this.finished = true;
    log(this + " left workstation after >" + this.cycleTime + "< seconds (processing was >" + this.processingDuration + "<)", "success");
  }

  /* Set the type (color) of this item */
  setColor(color) {
    this.color = color;
  }

  /* Sets the weight in grams */
  setWeight(weight) {
    this.weight = weight;
  }

  toString() {
    return "Item " + this.id + " (color: " + (this.color ? this.color : "-") + " / weight: " + (this.weight ? this.weight : "-") + ")";
  }

}

exports.Item = Item;
