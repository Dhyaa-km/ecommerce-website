import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env.js";

import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import userRoutes from "./modules/users/user.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

//auth 
app.use("/api/auth", authRoutes);
//products
app.use("/api/products", productRoutes);
//categories
app.use("/api/categories", categoryRoutes);
//cart
app.use("/api/cart", cartRoutes);
//order
app.use("/api/orders", orderRoutes);
//user
app.use("/api/users", userRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    message: "E-commerce API is running",
  });
});

export default app;