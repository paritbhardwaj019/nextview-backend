const DealerRouter = require("./Dealer");
const ActivationRouter = require("./Activation");

module.exports = [
  {
    path: "/dealers",
    router: DealerRouter,
  },
  {
    path: "/activations",
    router: ActivationRouter,
  },
];
