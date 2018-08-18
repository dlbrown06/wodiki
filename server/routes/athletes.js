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
          const { rows: wodRows } = await db.query(
            `
              SELECT
                w.id wod_id,
                w.name wod_name,
                w.as_prescribed,
                w.is_record,
                w.wod_date,
                w.created_on,
                wt.id wod_type_id,
                wt.name wod_type_name,
                wt.name wod_type_abbr,
                m.id wod_movement_id,
                m.name wod_movement_name,
                wm.order_num wod_movement_order,
                wmr.result wod_movement_result,
                mm.id wod_movement_result_measurement_id,
                mm.name wod_movement_result_measurement_name,
                mm.abbr wod_movement_result_measurement_abbr,
                u.id wod_movement_result_measurement_unit_id,
                u.name wod_movement_result_measurement_unit_name,
                u.abbr wod_movement_result_measurement_unit_abbr,
                u.is_metric wod_movement_result_measurement_unit_is_metric,
                a.id athlete_id,
                a.email athlete_email,
                a.first_name athlete_first_name,
                a.last_name athlete_last_name,
                a.gender athlete_gender,
                wtmr.id wod_type_measurement_result_id,
                wtmr.result wod_type_measurement_result_result,
                u2.id wod_type_measurement_result_unit_id,
                u2.name wod_type_measurement_result_unit_name,
                u2.abbr wod_type_measurement_result_unit_abbr
              FROM (
                SELECT
                  *
                FROM wods w
                WHERE w.created_by = $1
                ORDER BY w.wod_date DESC, w.created_on DESC
                LIMIT 30
              ) w
              INNER JOIN wod_types wt ON wt.id = w.wod_type_id
              INNER JOIN wod_movements wm ON wm.wod_id = w.id
              INNER JOIN movements m on m.id = wm.movement_id
              INNER JOIN wod_movement_results wmr on wmr.wod_movement_id = wm.id
              INNER JOIN measurements mm on mm.id = wmr.measurement_id
              INNER JOIN measurement_units mu ON mu.measurement_id = mm.id
              INNER JOIN units u ON u.id = mu.unit_id
              INNER JOIN athletes a on w.created_by = a.id
              INNER JOIN wod_type_measurements wtm ON wtm.wod_type_id = wt.id
              INNER JOIN wod_type_measurement_results wtmr ON wtmr.wod_id = w.id AND wtmr.wod_type_measurement_id = wtm.id
              INNER  JOIN units u2 ON u2.id = wtmr.unit_id
              ORDER BY wm.order_num ASC
            `,
            [athlete_id]
          );

          const wods = [];
          wodRows.forEach(r => {
            // group the wods
            let wodFound = wods.find(w => w.id === r.wod_id);
            if (!wodFound) {
              wodFound = {
                id: r.wod_id,
                name: r.wod_name,
                as_prescribed: r.as_prescribed,
                is_record: r.is_record,
                wod_date: r.wod_date,
                created_on: r.created_on,
                type: {},
                athlete: {},
                movements: [],
                score: []
              };
              wods.push(wodFound);
            }

            // group the movements
            let movementFound = wodFound.movements.find(
              m => m.id === r.wod_movement_id
            );
            if (!movementFound) {
              movementFound = {
                id: r.wod_movement_id,
                name: r.wod_movement_name,
                order_num: r.wod_movement_order,
                result: r.wod_movement_result,
                measurement: {
                  id: r.wod_movement_result_measurement_id,
                  name: r.wod_movement_result_measurement_name,
                  abbr: r.wod_movement_result_measurement_abbr,
                  unit: {
                    id: r.wod_movement_result_measurement_unit_id,
                    name: r.wod_movement_result_measurement_unit_name,
                    abbr: r.wod_movement_result_measurement_unit_abbr
                  }
                }
              };
              wodFound.movements.push(movementFound);
            }

            // group the athlete
            if (wodFound.athlete.id === undefined) {
              wodFound.athlete = {
                id: r.athlete_id,
                email: r.athlete_email,
                first_name: r.athlete_first_name,
                last_name: r.athlete_last_name,
                gender: r.athlete_gender
              };
            }

            // group the wod type
            if (wodFound.type.id === undefined) {
              wodFound.type = {
                id: r.wod_type_id,
                name: r.wod_type_name,
                abbr: r.wod_type_abbr
              };
            }

            let wodResultFound = wodFound.score.find(
              s => s.id === s.wod_type_measurement_result_id
            );
            if (!wodResultFound) {
              wodResultFound = {
                id: r.wod_type_measurement_result_id,
                result: r.wod_type_measurement_result_result,
                unit: {
                  id: r.wod_type_measurement_result_unit_id,
                  name: r.wod_type_measurement_result_unit_name,
                  abbr: r.wod_type_measurement_result_unit_abbr
                }
              };
              wodFound.score.push(wodResultFound);
            }
          });

          // get all the strength, including their movements and selected measurements
          const { rows: strengthRows } = await db.query(
            `
              SELECT
                s.id strength_id,
                s.name strength_name,
                s.strength_date,
                s.created_on,
                m.id movement_id,
                m.name movement_name,
                a.id athlete_id,
                a.email athlete_email,
                a.first_name athlete_first_name,
                a.last_name athlete_last_name,
                a.gender athlete_gender,
                ss.id strength_set_id,
                ss.order_num strength_set_order,
                ssr.id strength_set_result_id,
                ssr.result strength_set_result_result,
                mm.id strength_set_result_measurement_id,
                mm.name strength_set_result_measurement_name,
                mm.abbr strength_set_result_measurement_abbr,
                u.id strength_set_result_measurement_unit_id,
                u.name strength_set_result_measurement_unit_name,
                u.abbr strength_set_result_measurement_unit_abbr
              FROM (
                SELECT
                  *
                FROM strength s
                WHERE s.created_by = $1
                ORDER BY s.strength_date DESC, s.created_on DESC
                LIMIT 30
              ) s
              INNER JOIN movements m ON m.id = s.movement_id
              INNER JOIN athletes a ON a.id = s.created_by
              INNER JOIN strength_sets ss ON ss.strength_id = s.id
              INNER JOIN strength_set_results ssr ON ssr.strength_set_id = ss.id
              INNER JOIN measurements mm ON ssr.measurement_id = mm.id
              INNER JOIN units u ON u.id = ssr.unit_id
              ORDER BY ss.order_num ASC
            `,
            [athlete_id]
          );

          const strength = [];
          strengthRows.forEach(r => {
            // group the strength
            let strengthFound = strength.find(s => s.id === r.strength_id);
            if (!strengthFound) {
              strengthFound = {
                id: r.strength_id,
                name: r.strength_name,
                strength_date: r.strength_date,
                created_on: r.created_on,
                athlete: {},
                movement: {},
                sets: []
              };
              strength.push(strengthFound);
            }

            // group the sets
            let setFound = strengthFound.sets.find(
              s => s.id === r.strength_set_id
            );
            if (!setFound) {
              setFound = {
                id: r.strength_set_id,
                order_num: r.strength_set_order,
                results: []
              };
              strengthFound.sets.push(setFound);
            }

            setFound.results.push({
              id: r.strength_set_result_id,
              result: r.strength_set_result_result,
              measurement: {
                id: r.strength_set_result_measurement_id,
                name: r.strength_set_result_measurement_name,
                abbr: r.strength_set_result_measurement_abbr,
                unit: {
                  id: r.strength_set_result_measurement_unit_id,
                  name: r.strength_set_result_measurement_unit_name,
                  abbr: r.strength_set_result_measurement_unit_abbr
                }
              }
            });

            // group the athlete
            if (strengthFound.athlete.id === undefined) {
              strengthFound.athlete = {
                id: r.athlete_id,
                email: r.athlete_email,
                first_name: r.athlete_first_name,
                last_name: r.athlete_last_name,
                gender: r.athlete_gender
              };
            }

            // group the movement
            if (strengthFound.movement.id === undefined) {
              strengthFound.movement = {
                id: r.movement_id,
                name: r.movement_name
              };
            }
          });

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
