const auth = require("./middleware/auth");
const { fetchMeasurementResults } = require("./compilers/measurements");

module.exports = (fastify, opts, next) => {
  /**
   * @name ListMeasurements
   */
  fastify.route({
    method: "GET",
    url: "/measurements",
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      try {
        const db = await fastify.pg.connect();

        try {
          return reply.send(await fetchMeasurementResults(db));
        } catch (err) {
          fastify.log.error(err);
          reply.internalServerError(
            `Failed to Fetch Measurements: ${err.toString()}`
          );
        } finally {
          db.release();
        }
      } catch (err) {
        fastify.log.error(err);
        reply.internalServerError(
          `Failed to Begin to Fetch Measurements: ${err.toString()}`
        );
      }
    }
  });

  next();
};
