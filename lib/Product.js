var log = require('./simulationHelper.js').log;

class Product {

  constructor(type) {
    this.type = type
    this.workplan = {};
  }

  setWorkplan(workplan) {
    this.workplan = workplan;
  }

}

exports.Product = Product;
