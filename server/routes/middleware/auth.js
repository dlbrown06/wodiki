const httpStatus = require("http-status-codes");

const requireSysAdmin = async () => {};

const requireAdmin = async () => {};

const requireAthlete = (fastify, request, reply, done) => {
  // check user is logged in
  if (!request.headers.authorization) {
    return reply.status(httpStatus.UNAUTHORIZED).send({
      message: "Unauthorized"
    });
  }

  try {
    const auth = request.headers.authorization;
    const token = auth.substr(auth.indexOf(" ") + 1);
    request.user = fastify.jwt.verify(token);
  } catch (err) {
    request.log.error(err);
    return reply.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: "Failure to Verify Authentication",
      error: err
    });
  }

  return done();
};

module.exports = {
  requireAthlete
};
