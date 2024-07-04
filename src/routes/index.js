const DealerRouter = require("./Dealer");
const ActivationRouter = require("./Activation");
const NFRKeysRouter = require("./NFRKey");
const UserRouter = require("./User");
const KeyRouter = require("./Key");
const DashboardRouter = require("./Dashboard");
const ExpirationRouter = require("./Expiration");
const SupportRouter = require("./Support");

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
  {
    path: "/keys",
    router: KeyRouter,
  },
  {
    path: "/dashboard",
    router: DashboardRouter,
  },
  {
    path: "/expirations",
    router: ExpirationRouter,
  },
  {
    path: "/support",
    router: SupportRouter,
  },
];
