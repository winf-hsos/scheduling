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
}

exports.OrderItem = OrderItem;
