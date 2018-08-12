const httpStatus = require("http-status-codes");
const _ = require("lodash");
const uuid = require("uuid/v4");

const CONSTANTS = require("../../config/constants");
const auth = require("./middleware/auth");

module.exports = function(fastify, opts, next) {
  fastify.route({
    method: "POST",
    url: "/movements",
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" }
        },
        required: ["name", "type"],
        additionalProperties: false
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const { name, type } = request.body;

      try {
        // verify the connection to the DB is live
        const db = await fastify.pg.connect();

        await db.query(
          "INSERT INTO movements (id, name, type, created_by) VALUES ($1, $2, $3, $4)",
          [uuid(), name, type, request.user.id]
        );

        const { rows } = await db.query(
          "SELECT * FROM movements WHERE name = $1",
          [name]
        );

        db.release();

        return reply.status(httpStatus.CREATED).send({
          message: "Movement Created",
          result: rows.pop()
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
          message: "Failed to Create Movement",
          error: err.toString()
        });
      }
    }
  });

  fastify.route({
    method: "GET",
    url: "/movements",
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      try {
        // verify the connection to the DB is live
        const db = await fastify.pg.connect();

        const { rows } = await db.query(
          "SELECT *, count(*) over() as total_count FROM movements ORDER BY name ASC"
        );

        db.release();

        return reply.status(httpStatus.CREATED).send({
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
      }
    }
  });

  next();
};
