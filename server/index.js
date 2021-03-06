const path = require("path");

require("dotenv").config();

const CONSTANTS = require("../config/constants");

// Only include app monitoring on our prod instance
if (CONSTANTS.APP.ENV === "production") {
  require("newrelic");
}

// Require the framework and instantiate it
const fastify = require("fastify")({
  logger: {
    prettyPrint: CONSTANTS.APP.ENV !== "production"
  }
});
/**
 * Begin Registering Fastify Plugins
 */
fastify.register(require("fastify-sensible"));

fastify.register(require("fastify-static"), {
  root: path.join(
    __dirname,
    "..",
    "client",
    CONSTANTS.APP.ENV !== "local" ? "build" : "public"
  ),
  prefix: "/"
});

fastify.register(require("fastify-postgres"), {
  connectionString: CONSTANTS.APP.DB,
  ssl: { rejectUnauthorized: false }
});

fastify.register(require("fastify-jwt"), {
  secret: CONSTANTS.APP.SECRET
});

/**
 * Finished Registering Fastify Plugins
 */

/**
 * Include All Routes
 */
require("./routes")(fastify);

// Run the server!
const start = async () => {
  try {
    await fastify.listen(CONSTANTS.APP.PORT, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
