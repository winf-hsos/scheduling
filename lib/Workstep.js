var log = require('./simulationHelper.js').log;

class Workstep {

  constructor(no, workstation, duration) {
    this.no = no;
    this.workstation = workstation;
    this.duration = duration;
    this.finished = false;
  }

}

exports.Workstep = Workstep;
