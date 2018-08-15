const httpStatus = require("http-status-codes");
const _ = require("lodash");
const uuid = require("uuid/v4");

const CONSTANTS = require("../../config/constants");
const auth = require("./middleware/auth");

module.exports = function(fastify, opts, next) {
  fastify.route({
    method: "POST",
    url: "/strength",
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          strength_date: { type: "string", format: "date" },
          movement_id: { type: "string" },
          sets: {
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
                  distance: { type: ["number", "string"] },
                  height: { type: ["number", "string"] },
                  calories: { type: ["number", "string"] }
                }
              }
            ]
          }
        },
        required: ["name", "movement_id", "sets"],
        additionalProperties: false
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const { name, movement_id, strength_date, sets } = request.body;

      try {
        const db = await fastify.pg.connect();

        try {
          await db.query("BEGIN");

          // add the strength
          const { rows } = await db.query(
            "INSERT INTO strength (id, movement_id, strength_date, name, created_by) VALUES($1, $2, $3, $4, $5) RETURNING id",
            [uuid(), movement_id, strength_date, name, request.athlete.id]
          );

          const strengthId = rows[0].id;

          // add the moments
          let setNum = 0;
          for (let set of sets) {
            setNum++;
            await db.query(
              "INSERT INTO strength_sets (id, strength_id, set_number, weight, reps, height, distance, calories) VALUES($1, $2, $3, $4, $5, $6, $7, $8)",
              [
                uuid(),
                strengthId,
                setNum,
                set.weight === "" ? null : set.weight,
                set.reps === "" ? null : set.reps,
                set.height === "" ? null : set.height,
                set.distance === "" ? null : set.distance,
                set.calories === "" ? null : set.calories
              ]
            );
          }

          await db.query("COMMIT");
          return reply.status(httpStatus.CREATED).send({
            message: "Strength Created"
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
          message: "Failed to Create Strength",
          error: err.toString()
        });
      }
    }
  });

  fastify.route({
    method: "GET",
    url: "/strength/:athlete_id",
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
            st.id,
            st.name,
            st.created_by,
            st.created_on,
            st.movement_id,
            st.strength_date,
            mv.name movement_name,
            count(*) over () as total_records
          FROM strength st
            INNER JOIN movements mv on mv.id = st.movement_id
          WHERE st.created_by = $1
          ORDER BY st.strength_date DESC, st.created_on DESC
          LIMIT 50
        `,
          [athlete_id]
        );

        return reply.send({
          count: rows.length ? rows[0].total_records : 0,
          results: rows.map(row => {
            delete row.total_records;
            return row;
          })
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Failed to Fetch Strength",
          error: err.toString()
        });
      } finally {
        db.release();
      }
    }
  });

  next();
};
