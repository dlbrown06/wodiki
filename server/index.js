require('dotenv').config();

const CONSTANTS = require("./config/constants");

// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: {
    prettyPrint: CONSTANTS.APP.ENV !== "production"
  }
});

/**
 * Begin Registering Fastify Plugins
 */
fastify
  .register(require('fastify-react'))
  .after(() => {
    fastify.next('/hello')
  });

fastify.register(require('fastify-favicon'));

/**
 * Finished Registering Fastify Plugins
 */

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start();
