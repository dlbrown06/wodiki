module.exports = function(fastify, opts, next) {
  fastify.route({
    method: "GET",
    url: "/__health",
    schema: {},
    handler: async (request, reply) => {
      // verify the connection to the DB is live
      await fastify.pg.connect();

      reply.type("text/html").send("OK");
    }
  });

  next();
};
