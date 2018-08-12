const httpStatus = require("http-status-codes");
const _ = require("lodash");
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
      const db = await fastify.pg.connect();

      const { email, password } = request.body;

      if (email === SYS_ACCT.EMAIL && password === SYS_ACCT.PASSWORD) {
        // get the sys account from the DB
        const { rows } = await db.query(
          "SELECT * FROM athletes WHERE email=$1",
          [email]
        );
        db.release();

        if (!rows.length) {
          return reply.status(httpStatus.UNAUTHORIZED).send({
            message: "System Account Not Setup"
          });
        }

        const user = _.first(rows);
        const payload = {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin
        };

        // put more detail in the payload
        const token = fastify.jwt.sign(payload);
        fastify.log.info(`Token Generated for email '${email}': ${token}`);

        payload.token = token;
        payload.message = "User Authenticated";
        reply.send(payload);
      } else {
        reply.status(httpStatus.UNAUTHORIZED).send({
          message: "Invalid Athlete Login"
        });
      }
    }
  });

  next();
};
