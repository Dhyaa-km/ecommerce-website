import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";

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


app.get("/api/health", (_req, res) => {
  res.json({
    message: "E-commerce API is running",
  });
});

export default app;