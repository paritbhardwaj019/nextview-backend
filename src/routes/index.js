const DealerRouter = require("./Dealer");
const ActivationRouter = require("./Activation");
const NFRKeysRouter = require("./NFRKey");

module.exports = [
  {
    path: "/dealers",
    router: DealerRouter,
  },
  {
    path: "/activations",
    router: ActivationRouter,
  },
  {
    path: "/nfrkeys",
    router: NFRKeysRouter,
  },
];
