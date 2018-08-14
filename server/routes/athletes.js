const httpStatus = require("http-status-codes");
const _ = require("lodash");
const bcrypt = require("bcrypt");
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
      const db = await fastify.pg.connect();

      try {
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
      } catch (err) {
        fastify.log.error(err);
        reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: `Failed to Login Athlete: ${err.toString()}`
        });
      } finally {
        db.release();
      }
    }
  });

  fastify.route({
    method: "POST",
    url: "/athletes/register",
    schema: {
      body: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          gender: { type: "string" },
          birthday: { type: "string", format: "date" }
        },
        required: ["email", "password"],
        additionalProperties: false
      }
    },
    handler: async (request, reply) => {
      const {
        email,
        password,
        first_name,
        last_name,
        gender,
        birthday
      } = request.body;

      const genSalt = async rounds =>
        new Promise((resolve, reject) => {
          bcrypt.genSalt(rounds, (err, salt) => err ? reject(err) : resolve(salt));
        });

      const genHash = async (password, salt) =>
        new Promise((resolve, reject) => {
          bcrypt.hash(password, salt, (err, hash) => err ? reject(err) : resolve(hash));
        });

      const db = await fastify.pg.connect();
      try {
        const salt = await genSalt(16);
        const hash = await genHash(password, salt);

        // first verify this email doesn't exist
        const { rowCount: athleteFound } = await db.query(
          "SELECT id FROM athletes WHERE email=$1 LIMIT 1",
          [email]
        );
        if (athleteFound) {
          return reply.status(httpStatus.BAD_REQUEST).send({
            message: `Athlete Email Exists`
          });
        }

        const { rows: newAthletes } = await db.query(
          "INSERT INTO athletes (id, email, hash, salt, created_on, first_name, last_name, birthday, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
          [
            uuid(),
            email,
            hash,
            salt,
            new Date(),
            first_name,
            last_name,
            birthday,
            gender
          ]
        );

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
    }
  });

  next();
};
