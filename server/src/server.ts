import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully.");

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

startServer();