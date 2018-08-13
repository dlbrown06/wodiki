const httpStatus = require("http-status-codes");
const _ = require("lodash");
const uuid = require("uuid/v4");

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
          types: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["name", "types"],
        additionalProperties: false
      }
    },
    beforeHandler: (request, reply, done) =>
      auth.requireAthlete(fastify, request, reply, done),
    handler: async (request, reply) => {
      const { name, types } = request.body;

      const db = await fastify.pg.connect();
      try {
        await db.query(
          "INSERT INTO movements (id, name, types, created_by) VALUES ($1, $2, $3, $4)",
          [uuid(), name, types, request.user.id]
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
        db.release();
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
      const db = await fastify.pg.connect();

      try {
        const { rows } = await db.query(
          "SELECT *, count(*) over() as total_count FROM movements ORDER BY name ASC"
        );

        db.release();

        return reply.send({
          count: _.first(rows).total_count,
          results: rows.map(row => {
            delete row.total_count;
            return row;
          })
        });
      } catch (err) {
        db.release();
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
