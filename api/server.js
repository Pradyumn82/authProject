const express = require("express");
require("dotenv").config({ path:"../.env"});

const authRoutes = require("../routes/authRoutes");
const { connectDB } = require("../config/db");

const app = express();
// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
