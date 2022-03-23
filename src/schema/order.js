const uuid = require("uuid").v4;

// order amount, type,
class Order {
  constructor(type, amount) {
    this.id = uuid();
    this.type = type;
    this.amount = amount;
    this.lock = false;
  }
}

module.exports = { Order };
