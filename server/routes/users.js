const httpStatus = require("http-status-codes");
const CONSTANTS = require("../../config/constants");

const { SYS_ACCT } = CONSTANTS;

module.exports = function(fastify, opts, next) {
  fastify.route({
    method: "POST",
    url: "/athletes/login",
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          password: { type: "string" }
        },
        required: ["email", "password"],
        additionalProperties: false
      }
    },
    handler: async (request, reply) => {
      // verify the connection to the DB is live
      // await fastify.pg.connect();

      const { email, password } = request.body;

      if (email === SYS_ACCT.EMAIL && password === SYS_ACCT.PASSWORD) {
        // put more detail in the payload
        const token = fastify.jwt.sign({ email });
        fastify.log.info(`Token Generated for email '${email}': ${token}`);
        reply.send({ message: "User Authenticated", token });
      } else {
        reply.status(httpStatus.UNAUTHORIZED).send({
          message: "Invalid Member Login"
        });
      }
    }
  });

  next();
};
