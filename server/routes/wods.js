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
          name: { type: "string" },
          as_prescribed: { type: "boolean" },
          is_record: { type: "boolean" },
          wod_date: { type: "string", format: "date" },
          movements: {
            type: "array",
            items: [
              {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  measurements: {
                    type: "array",
                    items: [
                      {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          abbr: { type: "string" },
                          result: { type: "integer" },
                          unit_id: { type: "string" },
                          units: {
                            type: "array",
                            items: [
                              {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  abbr: { type: "string" },
                                  is_metric: { type: "boolean" }
                                }
                              }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          results: {
            type: "array",
            items: [
              {
                type: "object",
                parameters: {
                  measurement_id: { type: "string" },
                  unit_id: { type: "string" },
                  result: { type: "integer" }
                }
              }
            ]
          },
          wod_type: {
            type: "object",
            parameters: {
              id: { type: "string" }
            }
          }
        },
        required: ["name", "wod_type", "movements", "results", "wod_date"],
        additionalProperties: false
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const {
        name,
        as_prescribed,
        is_record,
        wod_date,
        movements,
        results,
        wod_type
      } = request.body;

      try {
        const db = await fastify.pg.connect();

        try {
          await db.query("BEGIN");

          // add the wod
          const { rows } = await db.query(
            "INSERT INTO wods (id, wod_date, name, wod_type_id, as_prescribed, is_record, created_by) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [
              uuid(),
              wod_date,
              name,
              wod_type.id,
              as_prescribed,
              is_record,
              request.athlete.id
            ]
          );

          const wodId = rows[0].id;

          // add the moments
          let movementNum = 0;
          for (let movement of movements) {
            movementNum++;
            const { rows: wodMovmentRows } = await db.query(
              "INSERT INTO wod_movements (id, wod_id, movement_id, order_num) VALUES($1, $2, $3, $4) RETURNING id",
              [uuid(), wodId, movement.id, movementNum]
            );

            const wodMovementId = wodMovmentRows[0].id;

            for (let measurement of movement.measurements) {
              await db.query(
                "INSERT INTO wod_movement_results (id, wod_movement_id, measurement_id, result, unit_id) VALUES($1, $2, $3, $4, $5)",
                [
                  uuid(),
                  wodMovementId,
                  measurement.id,
                  measurement.result,
                  measurement.unit_id
                ]
              );
            }
          }

          // add the score
          for (let result of results) {
            await db.query(
              "INSERT INTO wod_type_measurement_results (id, wod_id, result, wod_type_measurement_id, unit_id) VALUES($1, $2, $3, $4, $5)",
              [
                uuid(),
                wodId,
                result.result,
                result.measurement_id,
                result.unit_id
              ]
            );
          }

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
