var log = require('./helper.js').log;

class Workplan {

  constructor() {
    this.steps = [];
    this.currentStepNo = 1;
  }

  addStep(step) {
    this.steps.push(step);
  }

  getFirstWorkstation() {
    return this.steps[0].workstation;
  }

  getCurrentWorkstation() {
    return this.steps[this.currentStepNo - 1].workstation;
  }

  advance() {
    this.currentStepNo++;
    return this.getCurrentWorkstation();
  }

  toString() {
    return "Workplan - currentStep: " + this.currentStepNo + " - Number of Steps:  " + this.steps.length;
  }

}

exports.Workplan = Workplan;
