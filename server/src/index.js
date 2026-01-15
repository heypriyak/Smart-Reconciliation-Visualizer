const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { connectDb } = require("./db");

dotenv.config({ path: process.env.ENV_FILE || ".env" });

const datasetsRouter = require("./routes/datasets");
const reconcileRouter = require("./routes/reconcile");

const app = express();

/**
 * CORS
 * - Allow same-origin (Replit preview)
 * - Also works for local development
 */
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

/**
 * Body parsing
 */
app.use(express.json({ limit: "2mb" }));

/**
 * Serve frontend static files (Vite build)
 */
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * API routes
 */
app.use("/api/datasets", datasetsRouter);
app.use("/api/reconcile", reconcileRouter);

/**
 * SPA fallback (FIXED for Node 20)
 * NOTE: Use "/*" instead of "*"
 */
app.get("/*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Server error",
    details: err.issues || undefined,
  });
});

/**
 * App bootstrap
 */
async function main() {
  const port = Number(process.env.PORT || 5000);
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  await connectDb(mongoUri);

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
