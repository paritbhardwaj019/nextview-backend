const DealerRouter = require("./Dealer");
const ActivationRouter = require("./Activation");
const NFRKeysRouter = require("./NFRKey");
const UserRouter = require("./User");

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
  {
    path: "/admin",
    router: UserRouter,
  },
];
