const mongoose = require("mongoose");
const env = require("./env");
require("../models"); // ensure models are registered

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProd,
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`✅ MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
};

module.exports = connectDB;
