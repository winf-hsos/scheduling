var log = require('../lib/helper.js').log;

class Item {

  constructor(id) {
    this.id = id;
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
    return "Item " + this.id + " of color >" + (this.color ? this.color : "Not set") + "< and weight >" + this.weight + "<";
  }

}

exports.Item = Item;
