const httpStatus = require("http-status-codes");
const _ = require("lodash");
const crypto = require("crypto");
const uuid = require("uuid/v4");

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

  fastify.route({
    method: "POST",
    url: "/athletes/signup",
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
      const { email, password, first_name, last_name, gender, birthday } = request.body;

      const genRandomString = length => {
        return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
      };

      const sha512 = (pass, salt) => {
        const hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hash.update(pass);
        return hash.digest('hex');
      };

      const db = await fastify.pg.connect();
      try {
        const salt = genRandomString(16);
        const hash = sha512(password, salt);

        // first verify this email doesn't exist
        const { rowCount: athleteFound } = await db.query("SELECT id FROM athletes WHERE email=$1 LIMIT 1", [email]);
        if (athleteFound) {
          return reply.status(httpStatus.BAD_REQUEST).send({
            message: `Athlete Email Exists`
          });
        }

        const { rows: newAthletes } = await db.query("INSERT INTO athletes (id, email, hash, salt, created_on, first_name, last_name, birthday, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *", [
          uuid(),
          email,
          hash,
          salt,
          new Date(),
          first_name,
          last_name,
          birthday,
          gender
        ]);

        reply.status(httpStatus.CREATED).send({
          message: `Athlete Created`,
          result: newAthletes
        });

      } catch (err) {
        fastify.log.error(err);
        reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: `Failed to Create Athlete: ${err.toString()}`
        });
      } finally {
        db.release();
      }

      console.log("Email", email);
      console.log("Password", password);
      console.log("Salt", salt);
      console.log("Hash", hash);

      reply.status(httpStatus.UNAUTHORIZED).send({
        message: "Invalid Athlete Signup"
      });

      /*if (email === SYS_ACCT.EMAIL && password === SYS_ACCT.PASSWORD) {
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
      }*/
    }
  });

  next();
};
