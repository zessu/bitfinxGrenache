const { commandTypes } = require("./schema/call-types");

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const handleEvent = (orderBook, payload) => {
  switch (payload.type) {
    case commandTypes.get_order_book:
      return { data: orderBook, error: false };
    case commandTypes.get_default: // use this to seed data
      // might not actually be represented like this
      const egOB = {
        "c3d72bc0-687c-4bd2-a2db-115a32153bf7": {
          id: "c3d72bc0-687c-4bd2-a2db-115a32153bf7",
          type: "buy",
          amount: 200,
          locked: false,
        },
      };
      return egOB;
    case commandTypes.create_order:
      orderBook[payload.data.id] = payload.data;
      return {
        data: orderBook,
        error: false,
      };
    case commandTypes.lock_record: // does not need to send all this, only ACK
      const orderId = payload.orderId;
      if (!orderBook[orderId]) {
        return { error: true };
      }
      if (orderBook[orderId].lock) {
        return { error: true };
      }
      orderBook[orderId].lock = true;
      const res = {};
      res[orderId] = orderBook[orderId];
      return { error: false, data: { ...res } };
    case commandTypes.propagate_latest:
      orderBook = payload.latestState;
      return { error: null };
    default:
      return { error: true, errorMsg: "unkown error occurred" };
  }
};

const createNewOrder = (client, orderBook, order) => {
  // this should send command to server to create a new order
  // update local state and server state with the new order
  //TODO: we can move this to its own function that take order type to avoid repeating it
  client.map(
    "server_connect",
    {
      type: "create_order",
      data: order,
    },
    { timeout: 10000 },
    (err, data) => {
      if (err) {
        console.error(err);
        process.exit(-1);
      }
      if (data !== undefined && data.length && data[0]) {
        orderBook = data[0];
      }
    }
  );
};

const lockOrderMessage = (orderBook, peer, order) => (message, cb) => {
  // access orderBook within the closure in heap
  peer.request(
    "server_connect",
    { type: message, orderId: order.id },
    { timeout: 10000 },
    (err, data) => {
      if (err) {
        throw err;
      }
      data = { ...orderBook, ...data };
      cb(null, data);
    }
  );
};

const propagateMessage = (latestState, peer) => (message, cb) => {
  // access orderBook within the closure in heap
  peer.request(
    "server_connect",
    { type: message, data: latestState },
    { timeout: 10000 },
    (err, data) => {
      if (err) {
        throw err;
      }
      cb(null, data);
    }
  );
};

module.exports = {
  handleEvent,
  createNewOrder,
  delay,
  lockOrderMessage,
  propagateMessage,
};
