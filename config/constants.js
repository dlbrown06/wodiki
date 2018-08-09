const envVarNotSet = name => {
  console.log(`Environment Variable '${name}' Not Set`);
};

module.exports = {
  APP: {
    ENV: process.env.NODE_ENV || envVarNotSet("NODE_ENV"),
    PORT: process.env.PORT || 3000
  }
};
