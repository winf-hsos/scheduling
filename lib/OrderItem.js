var log = require('./simulationHelper.js').log;

class OrderItem {

  constructor(product, quantity, order) {
    this.quantity = quantity;
    this.produced = 0;
    this.weight = 0;
    this.released = false;
    this.order = order;
    this.product = product;
  }

  toString() {
    return "Order item - order id: " + this.order.id + " - type: " + this.product.type + " - quantity: " + this.quantity;
  }

  getFirstWorkstation() {
    log("Getting first worksation: " + this.product.workplan)
    var workstation = this.product.workplan.getFirstWorkstation();
    log("First workstation is: " + workstation);
    return workstation;
  }
  
  
  moveToNextWorksation() {
    var nextWorkstation = this.product.workplan.advance();
    nextWorkstation.queueItem(this);
  }

}

exports.OrderItem = OrderItem;
