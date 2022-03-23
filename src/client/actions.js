const util = require("util");
const { Order } = require("../schema/order");
const { orderTypes, commandTypes } = require("../schema/call-types");
const { lockOrderMessage, propagateMessage } = require("../util");

const createOrder = (type, amount) => {
  // assume order for the same item e.g BTC
  return new Order(type, amount);
};

//TODO: could improve on this to make it more effective for matching
const findBestMatch = (orderBook, order) => {
  // run code to check the best order we can match for this
  // send code to lock the order so we avoid race conditions
  // update the orders
  // send code to show new order sheet with removed lock
  // if there was a reminder, add it to the order book
  let bestMatch = {
    amount: Number.POSITIVE_INFINITY,
  };

  const matchType =
    order.type === orderTypes.buy ? orderTypes.sell : orderTypes.buy;

  for (let key in orderBook) {
    if (
      orderBook[key].type !== matchType ||
      orderBook[key].lock ||
      orderBook[key].amount - order.amount < 0
    ) {
      continue;
    }
    if (
      orderBook[key].amount - order.amount <
      bestMatch.amount - order.amount
    ) {
      bestMatch = { ...orderBook[key] };
    }
  }
  return bestMatch.amount !== Number.POSITIVE_INFINITY && bestMatch;
};

const lockOrder = async (peer, orderBook, order) => {
  const sendMessage = lockOrderMessage(orderBook, peer, order);
  const sendMessageAsync = util.promisify(sendMessage);
  let msg = { type: commandTypes.lock_record, orderId: order.id };
  return await sendMessageAsync(msg);
};

const updateOrders = (orders, order, match) => {
  if (match.amount > order.amount) {
    orders[match.id] = {
      ...orders[match.id],
      amount: match.amount - order.amount,
      lock: false,
    };
    delete orders[order.id];
  } else if (match.amount === order.amount) {
    delete orders[order.id];
    delete orders[match.id];
  } else {
    orders[order.id] = {
      ...orders[order.id],
      amount: order.amount - match.amount,
      lock: false,
    };
    delete orders[match.id];
  }
  return orders;
};

const propagateLatest = async (peer, latestOrderBookState) => {
  const sendMessage = propagateMessage(latestOrderBookState, peer);
  const sendMessageAsync = util.promisify(sendMessage);
  let msg = { type: commandTypes.propagate_latest };
  return await sendMessageAsync(msg);
};

module.exports = {
  createOrder,
  updateOrders,
  findBestMatch,
  lockOrder,
  propagateLatest,
};
