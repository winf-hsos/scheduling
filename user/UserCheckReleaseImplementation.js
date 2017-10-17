class UserCheckReleaseImplementation {

  constructor(controller) {
    this.controller = controller;
  }

  checkRelease() {
    // This array is returned at the end
    var itemsToRelease = [];

    // Get only orders with unreleased items
    var unreleasedOrders = this.controller.orders.filter(function(order) {
      return !order.isReleased()
    })

    if (unreleasedOrders.length == 0)
      return [];

    // TODO: Check if a release should be done, return null if not

    // Sort orders by due date ascending
    unreleasedOrders.sort(this.sortByDueAsc);

    // Get the order with the closest due date and release whole order
    itemsToRelease = unreleasedOrders[0].items;

    // Return empty or filled array
    return itemsToRelease;
  }

  sortByDueAsc(a, b) {
    return a.due - b.due;
  }
}

exports.UserCheckReleaseImplementation = UserCheckReleaseImplementation;
