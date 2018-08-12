const fs = require("fs");

module.exports = async fastify => {
  const dir = fs.readdirSync(__dirname);
  dir.forEach(routeFile => {
    if (routeFile === "index.js" || routeFile === "middleware") return;

    const routes = require(`${__dirname}/${routeFile}`);
    fastify.register(routes, { prefix: "/api" });
  });
};
