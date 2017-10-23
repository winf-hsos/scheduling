var log = require('./simulationHelper.js').log;

class Workstation {

  constructor(id, name, ip) {
    this.id = id;
    this.name = name;

    this.ip = ip;


    // TODO: Make parameter
    this.maxLengthInputQueue = 3;
    this.inputQueue = [];
  }

  canAcceptItem() {
    return this.inputQueue.length < this.maxLengthInputQueue;
  }

  queueItem(item) {
    log("Item " +item + " queued at workstation " + this.name);
  }

  processItem(item) {}

  releaseItem(item) {}

  setup(from, to) {

  }

  toString() {
    return "Workstation " + this.name;
  }


}

exports.Workstation = Workstation;
