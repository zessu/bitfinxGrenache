const commandTypes = {
  get_order_book: "get_order_book",
  create_order: "create_order",
  lock_record: "lock_record",
  update_order: "update_order",
  propagate_latest: "propagate_latest",
  get_default: "get_default",
};

const orderTypes = {
  buy: "buy",
  sell: "sell",
};

module.exports = {
  commandTypes,
  orderTypes,
};
