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
        "postgres://postgres:password@localhost:5432/postgres"
      ),
    SECRET: process.env.SECRET || envVarNotSet("SECRET", "notastrongsecret")
  },

  SYS_ACCT: {
    EMAIL:
      process.env.SYS_EMAIL || envVarNotSet("SYS_EMAIL", "email@example.com"),
    PASSWORD:
      process.env.SYS_PASSWORD ||
      envVarNotSet("SYS_PASSWORD", "thisisnotapassword")
  }
};
