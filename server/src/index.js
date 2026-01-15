const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb } = require("./db");

dotenv.config({ path: process.env.ENV_FILE || "env.example" });

const datasetsRouter = require("./routes/datasets");
const reconcileRouter = require("./routes/reconcile");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: false,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/datasets", datasetsRouter);
app.use("/api/reconcile", reconcileRouter);

// Basic error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Server error",
    details: err.issues || undefined,
  });
});

async function main() {
  const port = Number(process.env.PORT || 5000);
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("Missing MONGODB_URI in env.example");
  await connectDb(mongoUri);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

