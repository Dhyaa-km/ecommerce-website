import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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


app.get("/api/health", (_req, res) => {
  res.json({
    message: "E-commerce API is running",
  });
});

export default app;