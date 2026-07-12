import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { prisma } from "./config/prisma";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test Database connection
    await prisma.$connect();
    console.log("Database connection has been established successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
