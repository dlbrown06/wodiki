const httpStatus = require("http-status-codes");

const CONSTANTS = require("../../config/constants");

module.exports = async (fastify, opts, next) => {
  const client = await fastify.pg.connect();

  fastify.route({
    method: "GET",
    url: "/__health",
    schema: {},
    handler: async (request, reply) => {
      reply.type("text/html").send("OK");
    }
  });

  fastify.route({
    method: "GET",
    url: "/__db-setup",
    schema: {},
    beforeHandler: (request, reply, done) => {
      // verify user token
      const bearerToken = request.headers.authorization;
      if (!bearerToken) {
        return reply
          .status(httpStatus.UNAUTHORIZED)
          .send({ message: "Authorization Token Not Provided" });
      }

      const token = bearerToken.substr(bearerToken.indexOf(" ") + 1);
      fastify.jwt.verify(token, (err, decoded) => {
        if (err) return done(err);
        fastify.log.info(`Token verified. ${decoded.toString()}`);
        return done();
      });
    },
    handler: async (request, reply) => {
      reply.send("All Setup");
    }
  });

  next();
};
