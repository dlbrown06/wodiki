const httpStatus = require("http-status-codes");
const _ = require("lodash");
const uuid = require("uuid/v4");
const moment = require("moment");

const CONSTANTS = require("../../config/constants");
const auth = require("./middleware/auth");

module.exports = function(fastify, opts, next) {
  fastify.route({
    method: "POST",
    url: "/wods",
    schema: {
      body: {
        type: "object",
        properties: {
          wod_date: { type: "string", format: "date" },
          name: { type: "string" },
          type: { type: "string" },
          forRounds: { type: ["number", "string"] },
          timeCap: { type: ["number", "string"] },
          timeCapSec: { type: ["number"] },
          movements: {
            type: "array",
            items: [
              {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  type: { type: "string" },
                  reps: { type: ["number", "string"] },
                  weight: { type: ["number", "string"] },
                  calories: { type: ["number", "string"] }
                }
              }
            ]
          },
          score: {
            type: "object",
            properties: {
              reps: { type: ["number", "string"] },
              rounds: { type: ["number", "string"] },
              time: { type: "string" },
              time_sec: { type: ["number", "string"] }
            }
          }
        },
        required: ["name", "type", "movements", "score"],
        additionalProperties: false
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const {
        name,
        type,
        forRounds,
        movements,
        score,
        timeCap,
        timeCapSec,
        wod_date
      } = request.body;

      try {
        const db = await fastify.pg.connect();

        try {
          await db.query("BEGIN");

          // add the wod
          const { rows } = await db.query(
            "INSERT INTO wods (id, wod_date, name, type, for_rounds, time_cap, created_by) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [
              uuid(),
              wod_date,
              name,
              type,
              forRounds === "" ? null : forRounds,
              timeCap === "" ? null : timeCapSec,
              request.athlete.id
            ]
          );

          const wodId = rows[0].id;

          // add the moments
          let movementNum = 0;
          for (let movement of movements) {
            movementNum++;
            await db.query(
              "INSERT INTO wod_movements (id, wod_id, movement_id, movement_number, weight, reps, height, distance, calories) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)",
              [
                uuid(),
                wodId,
                movement.id,
                movementNum,
                movement.weight === "" ? null : movement.weight,
                movement.reps === "" ? null : movement.reps,
                movement.height === "" ? null : movement.height,
                movement.distance === "" ? null : movement.distance,
                movement.calories === "" ? null : movement.calories
              ]
            );
          }

          // add the score
          await db.query(
            "INSERT INTO wod_scores (id, wod_id, reps, rounds, total_time) VALUES($1, $2, $3, $4, $5)",
            [
              uuid(),
              wodId,
              score.reps === "" ? null : score.reps,
              score.rounds === "" ? null : score.rounds,
              score.time_sec === "" ? null : score.time_sec
            ]
          );

          await db.query("COMMIT");
          return reply.status(httpStatus.CREATED).send({
            message: "WOD Created"
          });
        } catch (err) {
          await db.query("ROLLBACK");
          throw err;
        } finally {
          db.release();
        }
      } catch (err) {
        fastify.log.error(err);
        return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Failed to Create WOD",
          error: err.toString()
        });
      }
    }
  });

  fastify.route({
    method: "GET",
    url: "/wods/:athlete_id",
    schema: {
      params: {
        athlete_id: { type: "string" }
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const { athlete_id } = request.params;

      const db = await fastify.pg.connect();

      try {
        const { rows } = await db.query(
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
            ws.total_time total_time,
            count(*)
            over () as total_records
          FROM wods
            INNER JOIN wod_scores ws ON ws.wod_id = wods.id
          WHERE created_by = $1
          ORDER BY wod_date DESC, created_on DESC
          LIMIT 50
        `,
          [athlete_id]
        );

        return reply.send({
          count: rows.length ? rows[0].total_records : 0,
          results: rows.map(row => {
            delete row.total_records;
            row.wod_date = row.wod_date
              ? moment(row.wod_date)
                  .utcOffset("+17:00")
                  .format("YYYY-MM-DD HH:mm:ss")
              : row.wod_date;
            return row;
          })
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Failed to Fetch WODs",
          error: err.toString()
        });
      } finally {
        db.release();
      }
    }
  });

  next();
};
