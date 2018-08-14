const httpStatus = require("http-status-codes");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const uuid = require("uuid/v4");
const SparkPost = require("sparkpost");

const emailClient = new SparkPost();

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

        // permit SYS_USER login
        if (email === SYS_ACCT.EMAIL && password === SYS_ACCT.PASSWORD) {
          // get the sys account from the DB
          const { rows } = await db.query(
            "SELECT * FROM athletes WHERE email=$1",
            [email]
          );

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
          return reply.send(payload);
        }

        // validate the athlete
        const { rows: athletes } = await db.query(
          "SELECT id, email, is_admin, hash FROM athletes WHERE email=$1 AND verified IS NOT NULL LIMIT 1",
          [email]
        );

        if (!athletes.length) {
          return reply.status(httpStatus.UNAUTHORIZED).send({
            message: "Verified Athlete Not Found"
          });
        }

        const athlete = _.first(athletes);

        const valid = new Promise((resolve, reject) => {
          bcrypt.compare(
            password,
            athlete.hash,
            (err, res) => (err ? reject(err) : resolve(res))
          );
        });

        if (!valid) {
          return reply.status(httpStatus.UNAUTHORIZED).send({
            message: "Invalid Credentials"
          });
        }

        // generate a token
        const payload = {
          id: athlete.id,
          email: athlete.email,
          is_admin: athlete.is_admin
        };

        const token = await new Promise((resolve, reject) => {
          fastify.jwt.sign(
            payload,
            { expiresIn: "7d" },
            (err, token) => (err ? reject(err) : resolve(token))
          );
        });

        fastify.log.info(`Token Generated for email '${email}': ${token}`);

        // save the token in a athlete sessions table
        const now = new Date();
        let expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // in 7 days
        await db.query(
          "INSERT INTO athlete_sessions (id, athlete_id, created_on, expires_on) VALUES ($1, $2, $3, $4)",
          [uuid(), athlete.id, new Date(), expires]
        );

        // return the token
        payload.token = token;
        payload.message = "User Authenticated";

        return reply.send(payload);
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
          bcrypt.genSalt(
            rounds,
            (err, salt) => (err ? reject(err) : resolve(salt))
          );
        });

      const genHash = async (password, salt) =>
        new Promise((resolve, reject) => {
          bcrypt.hash(
            password,
            salt,
            (err, hash) => (err ? reject(err) : resolve(hash))
          );
        });

      const db = await fastify.pg.connect();
      try {
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

        const salt = await genSalt(16);
        const hash = await genHash(password, salt);
        const verify_id = uuid().replace(/-/g, "");

        const { rows: newAthletes } = await db.query(
          "INSERT INTO athletes (id, email, hash, salt, created_on, first_name, last_name, birthday, gender, verify_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
          [
            uuid(),
            email,
            hash,
            salt,
            new Date(),
            first_name,
            last_name,
            birthday,
            gender,
            verify_id
          ]
        );

        await emailClient.transmissions.send({
          content: {
            template_id: "email-verification",
            use_draft_template: true
          },
          substitution_data: {
            verify_id: verify_id,
            email
          },
          recipients: [{ address: email }]
        });

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

  fastify.route({
    method: "GET",
    url: "/athletes/verify",
    schema: {
      querystring: {
        token: { type: "string" },
        email: { type: "string", format: "email" }
      }
    },
    handler: async (request, reply) => {
      const { email, token } = request.query;

      const db = await fastify.pg.connect();
      try {
        // check if they already verified
        const { rows: athleteVerified } = await db.query(
          "SELECT * FROM athletes WHERE verify_id=$1 AND email=$2 AND verified IS NOT NULL LIMIT 1",
          [token, email]
        );

        if (athleteVerified.length) {
          return reply.status(httpStatus.BAD_REQUEST).send({
            message: "Athlete Email Already Verified"
          });
        }

        // ensure the athlete verification id exists
        const { rows: athleteFound } = await db.query(
          "SELECT * FROM athletes WHERE verify_id=$1 AND email=$2 LIMIT 1",
          [token, email]
        );

        if (!athleteFound.length) {
          return reply.status(httpStatus.BAD_REQUEST).send({
            message: `Athlete Email or Verification ID Not Found`
          });
        }

        // verify the athlete email
        await db.query(
          "UPDATE athletes SET verified=$1 WHERE email=$2 AND verify_id=$3",
          [new Date(), email, token]
        );

        await emailClient.transmissions.send({
          content: {
            template_id: "email-verified",
            use_draft_template: true
          },
          substitution_data: {},
          recipients: [{ address: email }]
        });

        reply.status(httpStatus.CREATED).send({
          message: `Athlete Verified`
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
