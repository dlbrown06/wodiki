const httpStatus = require("http-status-codes");
const _ = require("lodash");
const uuid = require("uuid/v4");

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
          name: { type: "string" },
          type: { type: "string" },
          forRounds: { type: ["number", "string"] },
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
                  weight: { type: ["number", "string"] }
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
      const { name, type, forRounds, movements, score, timeCap } = request.body;

      try {
        const db = await fastify.pg.connect();

        try {
          await db.query("BEGIN");

          // add the wod
          const { rows } = await db.query(
            "INSERT INTO wods (id, name, type, for_rounds, time_cap, created_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
            [
              uuid(),
              name,
              type,
              forRounds === "" ? null : forRounds,
              timeCap === "" ? null : timeCap,
              request.user.id
            ]
          );

          const wodId = rows[0].id;

          // add the moments
          for (let movement of movements) {
            await db.query(
              "INSERT INTO wod_movements (id, wod_id, movement_id, weight, reps) VALUES($1, $2, $3, $4, $5)",
              [
                uuid(),
                wodId,
                movement.id,
                movement.weight === "" ? null : movement.weight,
                movement.reps === "" ? null : movement.reps
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

  next();
};
