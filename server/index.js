const path = require("path");

require("dotenv").config();

const CONSTANTS = require("../config/constants");

// Require the framework and instantiate it
const fastify = require("fastify")({
  logger: {
    prettyPrint: CONSTANTS.APP.ENV !== "production"
  }
});

/**
 * Begin Registering Fastify Plugins
 */
/*fastify
  .register(require("fastify-react"), {
    dev: CONSTANTS.APP.ENV !== "production"
  })
  .after(() => {
    fastify.next("/");
  });*/

fastify.register(require("fastify-favicon"), {
  path: "../client/public"
});

/**
 * Finished Registering Fastify Plugins
 */

/*fastify.next('/', (app, req, reply) => {
  // your code
  // `app` is the Next instance
  app.render(req.raw, reply.res, '/', req.query, {});
});*/

// Declare a route
fastify.get("/", async (request, reply) => {
  reply.sendFile(path.join(__dirname, "..", "..", "build", "index.html"));
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(CONSTANTS.APP.PORT);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
