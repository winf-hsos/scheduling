var log = require('../lib/helper.js').log;

class Item {

  constructor(id) {
    this.id = id;
  }

  /* Set the type (color) of this item */
  setType(type) {
    this.type = type;
  }

  /* Sets the weight in grams */
  setWeight(weight) {
    this.weight = weight;
  }

  toString() {
    return "Item " + this.id + " of type >" + this.type + "<";
  }

}

exports.Item = Item;
