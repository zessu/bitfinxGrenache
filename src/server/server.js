const { PeerRPCServer } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");
const { handleEvent } = require("../util");
const link = new Link({
  grape: "http://127.0.0.1:30001",
});
link.start();

let orderBook = {};

const peer = new PeerRPCServer(link, {
  timeout: 300000,
});
peer.init();

const port = 4000;
const service = peer.transport("server");
service.listen(port);

setInterval(function () {
  link.announce("server_connect", service.port, {});
}, 1000);

service.on("request", (rid, key, payload, handler) => {
  const response = handleEvent(orderBook, payload);
  if (!response.error) {
    return handler.reply(null, response.data);
  } else {
    // there was some kind of error
    handler.reply(true);
  }
});
