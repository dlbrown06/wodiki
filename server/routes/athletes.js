const httpStatus = require("http-status-codes");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const uuid = require("uuid/v4");
const SparkPost = require("sparkpost");

const emailClient = new SparkPost();

const auth = require("./middleware/auth");
const CONSTANTS = require("../../config/constants");
const { fetchMeasurementResults } = require("./compilers/measurements");
const { fetchMovementResults } = require("./compilers/movements");
const { fetchWODResultsByAthlete, fetchWODTypes } = require("./compilers/wods");
const { fetchStrengthResultsByAthlete } = require("./compilers/strength");

const { SYS_ACCT } = CONSTANTS;

module.exports = function(fastify, opts, next) {
  /**
   * @name Login
   */
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

        const valid = await new Promise((resolve, reject) => {
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

  /**
   * @name Register
   */
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

  /**
   * @name VerifyEmail
   */
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

  /**
   * @name Dashboard
   */
  fastify.route({
    method: "GET",
    url: "/athletes/:athlete_id/dashboard",
    schema: {
      params: {
        athlete_id: { type: "string" }
      },
      required: ["athlete_id"]
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      try {
        const { athlete_id } = request.params;
        const db = await fastify.pg.connect();

        try {
          // get all the measurements and units etc
          const measurements = await fetchMeasurementResults(db);

          // get all the movements and their measurements etc
          const movements = await fetchMovementResults(db);

          // get all the wod types
          const wod_types = await fetchWODTypes(db);

          // get all the wods, including their movements and selected measurements
          const wods = await fetchWODResultsByAthlete(db, athlete_id);

          // get all the strength, including their movements and selected measurements
          const strength = await fetchStrengthResultsByAthlete(db, athlete_id);

          reply.send({
            measurements,
            movements,
            wod_types,
            wods,
            strength
          });
        } catch (err) {
          fastify.log.error(err);
          reply.internalServerError(
            `Failed to Fetch Athlete Dashboard: ${err.toString()}`
          );
        } finally {
          db.release();
        }
      } catch (err) {
        fastify.log.error(err);
        reply.internalServerError(
          `Failed to Begin to Fetch Athlete Dashboard: ${err.toString()}`
        );
      }
    }
  });

  next();
};
