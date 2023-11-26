const http = require("http");
const app = require("./app");
const { port } = require("./config");
const connectDB = require("./database/connectDB");
const logger = require("./utils/logger");

const server = http.createServer(app);

server.listen(port, () => {
  logger.info(`Server is running on PORT ${port}`);
  connectDB();
});
