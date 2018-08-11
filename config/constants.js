const envVarNotSet = (name, value) => {
  if (value) {
    console.warn(
      `Missing environment variable '${name}' - Defaulting to '${value}'.`
    );
    return value;
  }

  console.error(`Missing required environment variable '${name}'`);
  process.exit(0);
};

module.exports = {
  APP: {
    ENV: process.env.NODE_ENV || "local",
    PORT: process.env.PORT || 3000,
    DB:
      process.env.DATABASE_URL ||
      envVarNotSet(
        "DATABASE_URL",
        "postgres://postgres@localhost:5432/postgres"
      )
  }
};
