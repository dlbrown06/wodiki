const envVarNotSet = name => {
  console.warn(`Environment Variable '${name}' Not Set`);
};

module.exports = {
  APP: {
    ENV: process.env.NODE_ENV || "local",
    PORT: process.env.PORT || 3000,
    DB: process.env.DATABASE_URL || envVarNotSet("DATABASE_URL")
  }
};
