// src/config/db.js
const mongoose = require("mongoose");
exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database connection error", error);
    process.exit(1);
  }
};
