const httpStatus = require("http-status-codes");
const _ = require("lodash");
const uuid = require("uuid/v4");

const auth = require("./middleware/auth");

module.exports = function(fastify, opts, next) {
  /**
   * @name CreateMovement
   */
  fastify.route({
    method: "POST",
    url: "/movements",
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          measurements: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["name", "measurements"],
        additionalProperties: false
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      try {
        const { name, measurements } = request.body;
        const db = await fastify.pg.connect();

        try {
          await db.query("BEGIN");

          // get the measurement ids
          const { rows: measurementsIds } = await db.query(
            `SELECT id FROM measurements WHERE name = ANY($1)`,
            [measurements]
          );

          const { rows: movements } = await db.query(
            "INSERT INTO movements (id, name, created_by) VALUES ($1, $2, $3) RETURNING *",
            [uuid(), name, request.athlete.id]
          );

          const movement = movements.pop();
          movement.measurements = [];
          for (const idObj of measurementsIds) {
            const { rows } = await db.query(
              "INSERT INTO movement_measurements (id, movement_id, measurement_id) VALUES ($1, $2, $3) RETURNING *",
              [uuid(), movement.id, idObj.id]
            );
            movement.measurements.push(rows.pop());
          }

          await db.query("COMMIT");
          return reply.status(httpStatus.CREATED).send({
            message: "Movement Created",
            result: movement
          });
        } catch (err) {
          await db.query("ROLLBACK");
          fastify.log.error(err);
          reply.internalServerError(
            `Failed to Create Movement: ${err.toString()}`
          );
        } finally {
          db.release();
        }
      } catch (err) {
        fastify.log.error(err);
        reply.internalServerError(
          `Failed to Begin to Create Movement: ${err.toString()}`
        );
      }
    }
  });

  /**
   * @name ListMovements
   */
  fastify.route({
    method: "GET",
    url: "/movements",
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const db = await fastify.pg.connect();

      try {
        const { rows } = await db.query(
          "SELECT *, count(*) over() as total_count FROM movements ORDER BY name ASC"
        );

        return reply.send({
          count: _.first(rows).total_count,
          results: rows.map(row => {
            delete row.total_count;
            return row;
          })
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Failed to Create Movement",
          error: err.toString()
        });
      } finally {
        db.release();
      }
    }
  });

  next();
};
