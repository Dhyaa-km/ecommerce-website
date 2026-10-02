import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";

describe("POST /api/auth/login", () => {
  it("should reject an empty request", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});

describe("GET /api/auth/me", () => {
  it("should reject requests without an access token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Access token required");
  });
});

describe("POST /api/auth/register", () => {
  it("should reject invalid registration data", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "A",
        email: "invalid-email",
        password: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});


describe("POST /api/auth/register", () => {
  it("should register a new user", async () => {
    const email = `test-${Date.now()}@example.com`;

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email,
        password: "password123",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(email);

    await prisma.user.delete({
      where: { email },
    });
  });
});


describe("POST /api/auth/register - duplicate email", () => {
  it("should reject an already registered email", async () => {
    const email = `duplicate-${Date.now()}@example.com`;

    await request(app)
      .post("/api/auth/register")
      .send({
        name: "First User",
        email,
        password: "password123",
      });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Second User",
        email,
        password: "password123",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already registered");

    await prisma.user.delete({
      where: { email },
    });
  });
});

describe("POST /api/auth/login - success", () => {
  it("should login an existing user", async () => {
    const email = `login-${Date.now()}@example.com`;
    const password = "password123";

    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Login Test User",
        email,
        password,
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(email);

    await prisma.user.delete({
      where: { email },
    });
  });
});

describe("POST /api/auth/login - invalid credentials", () => {
  it("should reject an incorrect password", async () => {
    const email = `wrong-password-${Date.now()}@example.com`;
    const password = "password123";

    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Wrong Password User",
        email,
        password,
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");

    await prisma.user.delete({
      where: { email },
    });
  });
});

