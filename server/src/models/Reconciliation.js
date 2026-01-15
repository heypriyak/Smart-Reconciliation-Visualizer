const mongoose = require("mongoose");

const ReconciliationSchema = new mongoose.Schema(
  {
    datasetA: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", required: true },
    datasetB: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset", required: true },
    keyFields: { type: [String], required: true },
    compareFields: { type: [String], default: ["amount"] },
    amountTolerance: { type: Number, default: 0 },
    summary: {
      matches: { type: Number, default: 0 },
      mismatches: { type: Number, default: 0 },
      missingInA: { type: Number, default: 0 },
      missingInB: { type: Number, default: 0 },
      totalA: { type: Number, default: 0 },
      totalB: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reconciliation", ReconciliationSchema);

