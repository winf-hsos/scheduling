var fs = require('fs');
var log = require('./simulationHelper.js').log;
var {
  Workstation
} = require('./Workstation.js');
var {
  Product
} = require('./Product.js');
var {
  Workplan
} = require('./Workplan.js');
var {
  Workstep
} = require('./Workstep.js');
var {
  Order
} = require('./Order.js');
var {
  OrderItem
} = require('./OrderItem.js');
var {
  UserCheckReleaseImplementation
} = require('../user/UserCheckReleaseImplementation.js');

class Controller {

  constructor() {
    this.userCheckReleaseImplementation = new UserCheckReleaseImplementation(this);
    this.workstations = [];
    this.products = [];
    this.orders = [];
  }

  init() {
    return new Promise((resolve, reject) => {
      log("Init controller", "debug");
      var _this = this;

      // Setup controller etc. from setup.json
      fs.readFile('setup/setup.json', 'utf8', function(err, data) {
        if (err) throw err;
        var setupInfo = JSON.parse(data);

        // Setup the workstations
        setupInfo.workstations.forEach(function(workstation) {
          _this.workstations.push(new Workstation(workstation.id, workstation.name, workstation.ip));
        });

        // Setup the products, workpland and worksteps
        setupInfo.products.forEach(function(product) {
          var productObj = new Product(product.type);

          var workplan = new Workplan();
          product.workplan.forEach(function(step) {
            workplan.addStep(new Workstep(step.workstation, step.duration));
          });

          productObj.setWorkplan(workplan);
          _this.products.push(productObj);
        });

        // Setup the orders
        setupInfo.orders.forEach(function(order) {

          var orderHead = new Order(order.id, order.due);

          // Setup order items for this order
          var orderItems = [];
          order.products.forEach(function(item) {
            orderItems.push(new OrderItem(_this.getProductByType(item.type), item.quantity, order));
          });

          orderHead.setOrderItems(orderItems);
          _this.orders.push(orderHead);
        });

        return resolve();
      });
    });

  }


  checkRelease() {
    // Run the user's implementation
    var itemsToRelease = this.userCheckReleaseImplementation.checkRelease();
    var _this = this;

    if (itemsToRelease.length > 0) {
      itemsToRelease.forEach(function(item) {
        log("Releasing: " + item);
        _this.releaseItem(item);
      });
    } else {
      log("Nothing to release.");
    }
  }

  /* Releases all items of the order */
  releaseOrder(order) {
    order.items.forEach(this.releaseItem);
  }

  /* Releases a single item of an order */
  releaseItem(item) {
    if (item.released === false) {
      item.released = true;
    } else {
      log("Item is already released.", "warning");
    }
  }

  processItem(item) {}


  getProductByType(type) {
    var result = this.products.filter(function(product) {
      return product.type == type;
    })

    return result[0];
  }


}

exports.Controller = Controller;
