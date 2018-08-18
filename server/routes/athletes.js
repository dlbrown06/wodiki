const httpStatus = require("http-status-codes");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const uuid = require("uuid/v4");
const SparkPost = require("sparkpost");

const emailClient = new SparkPost();

const auth = require("./middleware/auth");
const CONSTANTS = require("../../config/constants");

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
          const measurements = [];
          const { rows: measurementRows } = await db.query(
            `
              SELECT
                m.id,
                m.name,
                m.abbr,
                u.id unit_id,
                u.name unit_name,
                u.abbr unit_abbr,
                u.is_metric unit_is_metric
              FROM measurements m
              LEFT JOIN measurement_units mu ON mu.measurement_id = m.id
              LEFT JOIN units u ON u.id = mu.unit_id
              ORDER BY m.name ASC
            `
          );

          measurementRows.forEach(row => {
            const found = measurements.find(item => item.name === row.name);
            if (found) {
              if (row.unit_id) {
                found.units.push({
                  id: row.unit_id,
                  name: row.unit_name,
                  abbr: row.unit_abbr,
                  is_metric: row.unit_is_metric
                });
              }
            } else {
              const units = [];
              if (row.unit_id) {
                units.push({
                  id: row.unit_id,
                  name: row.unit_name,
                  abbr: row.unit_abbr,
                  is_metric: row.unit_is_metric
                });
              }
              measurements.push({
                id: row.id,
                name: row.name,
                abbr: row.abbr,
                units
              });
            }
          });

          // get all the movements and their measurements etc
          const movements = [];
          let { rows: movementRows } = await db.query(
            `
              SELECT
                m.id,
                m.name,
                mm.measurement_id,
                m.created_on,
                m.created_by
              FROM movements m
              INNER JOIN movement_measurements mm ON mm.movement_id = m.id
              ORDER BY m.name ASC
            `
          );

          movementRows.forEach(row => {
            const found = movements.find(item => item.name === row.name);
            if (found) {
              found.measurements.push(
                measurements.find(item => item.id === row.measurement_id)
              );
            } else {
              movements.push({
                id: row.id,
                name: row.name,
                measurements: [
                  measurements.find(item => item.id === row.measurement_id)
                ],
                created_on: row.created_on,
                created_by: row.created_by
              });
            }
          });

          // get all the wods, including their movements and selected measurements
          const { rows: wods } = await db.query(
            `
              SELECT
                wods.id,
                wods.name,
                wods.type,
                wods.for_rounds,
                wods.time_cap,
                wods.created_by,
                wods.created_on,
                wods.wod_date,
                ws.reps total_reps,
                ws.rounds total_rounds,
                ws.total_time total_time
              FROM wods
                INNER JOIN wod_scores ws ON ws.wod_id = wods.id
              WHERE created_by = $1
              ORDER BY wod_date DESC, created_on DESC
              LIMIT 30
            `,
            [athlete_id]
          );

          // get all the strength, including their movements and selected measurements
          const { rows: strength } = await db.query(
            `
              SELECT
                st.id,
                st.name,
                st.created_by,
                st.created_on,
                st.movement_id,
                st.strength_date,
                mv.name movement_name
              FROM strength st
                INNER JOIN movements mv on mv.id = st.movement_id
              WHERE st.created_by = $1
              ORDER BY st.strength_date DESC, st.created_on DESC
              LIMIT 30
            `,
            [athlete_id]
          );

          reply.send({
            measurements,
            movements,
            wods,
            strength
          });
        } catch (err) {
          throw err;
        } finally {
          db.release();
        }
      } catch (err) {
        fastify.log.error(err);
        reply.internalServerError(
          `Failed to Fetch Athlete Dashboard: ${err.toString()}`
        );
      }
    }
  });

  next();
};
