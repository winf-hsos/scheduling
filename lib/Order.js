class Order {

  constructor(id, due) {
    this.id = id;
    this.due = due;

    this.released = false;
  }

  setOrderItems(orderItems) {
    this.items = orderItems;
  }

  getTotalItems() {
    var items = 0;
    this.items.forEach(function(item) {
      items += item.quantity;
    });

    return items;
  }

  isReleased() {
    var result = true;
    this.items.forEach(function(item) {
      if (item.released === false) {
        result = false;
      }
    });

    return result;
  }


}

exports.Order = Order;
