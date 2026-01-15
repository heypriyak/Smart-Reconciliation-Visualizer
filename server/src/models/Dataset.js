const mongoose = require("mongoose");

const DatasetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    originalFilename: { type: String, required: true },
    fileType: { type: String, enum: ["csv", "xlsx"], required: true },
    headers: { type: [String], default: [] },
    rowCount: { type: Number, default: 0 },
    // Store full data for demo simplicity; for production you'd normalize/chunk.
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dataset", DatasetSchema);

