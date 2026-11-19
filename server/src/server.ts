import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import { expirePendingOrders } from "./modules/orders/payment.service.js";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully.");

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    const runExpirationCheck = async () => {
      try {
        const count = await expirePendingOrders();

        if (count > 0) {
          console.log(`Expired ${count} unpaid order(s).`);
        }
      } catch (error) {
        console.error("Order expiration check failed:", error);
      }
    };
    void runExpirationCheck();

    setInterval(() => {
      void runExpirationCheck();
    }, 60_000);

  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

startServer();