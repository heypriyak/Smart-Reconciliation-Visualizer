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
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.CLIENT_ORIGIN,
  /\.replit\.dev$/,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.some(o => 
        typeof o === 'string' ? o === origin : o.test?.(origin)
      )) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for dev
      }
    },
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
 * Serve frontend for all other routes (SPA fallback)
 */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
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
