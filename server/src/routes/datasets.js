const express = require("express");
const multer = require("multer");
const path = require("path");
const { nanoid } = require("nanoid");
const Dataset = require("../models/Dataset");
const { parseUploadedFile } = require("../parseUpload");

const router = express.Router();

const upload = multer({
  dest: path.join(process.cwd(), "uploads"),
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB || 10) || 10) * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    const name = (req.body?.name || "").trim() || `Dataset-${nanoid(6)}`;
    const parsed = await parseUploadedFile({
      filePath: req.file.path,
      originalname: req.file.originalname,
    });

    const ds = await Dataset.create({
      name,
      originalFilename: req.file.originalname,
      fileType: parsed.fileType,
      headers: parsed.headers,
      rowCount: parsed.rows.length,
      rows: parsed.rows,
    });

    res.json({
      datasetId: ds._id,
      name: ds.name,
      originalFilename: ds.originalFilename,
      fileType: ds.fileType,
      headers: ds.headers,
      rowCount: ds.rowCount,
      preview: ds.rows.slice(0, 25),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const ds = await Dataset.findById(req.params.id).lean();
    if (!ds) return res.status(404).json({ error: "Dataset not found" });
    res.json({
      datasetId: ds._id,
      name: ds.name,
      originalFilename: ds.originalFilename,
      fileType: ds.fileType,
      headers: ds.headers,
      rowCount: ds.rowCount,
      preview: (ds.rows || []).slice(0, 50),
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

