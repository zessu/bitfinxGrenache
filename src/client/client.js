const { PeerRPCClient } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");
const {
  createOrder,
  updateOrders,
  findBestMatch,
  lockOrder,
  propagateLatest,
} = require("../client/actions");
const { createNewOrder, delay } = require("../util");

let orderBook = {};

const link = new Link({
  grape: "http://127.0.0.1:30001",
});
link.start();

const peer = new PeerRPCClient(link, {});
peer.init();

const order1 = createOrder("buy", 100);
createNewOrder(peer, orderBook, order1);

// const order2 = createOrder("buy", 200);
// createNewOrder(peer, orderBook, order2);

const order3 = createOrder("sell", 100);
createNewOrder(peer, orderBook, order3);

const order4 = createOrder("sell", 20);
createNewOrder(peer, orderBook, order4); //TODO: could structure to use await

// const order4 = createOrder("sell", 200);
// createNewOrder(peer, orderBook, order4);

peer.request(
  "server_connect",
  { type: "get_order_book" },
  { timeout: 10000 },
  (err, data) => {
    if (err) {
      console.error(err);
      process.exit(-1);
    }
    orderBook = { ...orderBook, ...data };
  }
);

delay(2000).then(async () => {
  const bestMatch = findBestMatch(orderBook, order1);
  if (bestMatch) {
    console.log(`found best match for order`);
    console.log(bestMatch);
    try {
      const allOrders = await lockOrder(peer, orderBook, bestMatch);
      console.log("locked order as follows");
      console.log(">>>>>");
      console.log(allOrders);
      console.log(">>>>>");
      const updatedOrders = updateOrders(allOrders, order1, bestMatch);
      console.log("remaining orders");
      console.log(updatedOrders);

      // order matched well
      // propagate changes
      await propagateLatest(peer, allOrders); // no need to set here
    } catch (e) {
      console.log(e);
    }
  }
});
