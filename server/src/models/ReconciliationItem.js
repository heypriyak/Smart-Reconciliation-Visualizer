const mongoose = require("mongoose");

const ReconciliationItemSchema = new mongoose.Schema(
  {
    reconciliationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reconciliation",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["match", "mismatch", "missing_in_a", "missing_in_b"],
      required: true,
      index: true,
    },
    key: { type: String, required: true, index: true },
    recordA: { type: mongoose.Schema.Types.Mixed, default: null },
    recordB: { type: mongoose.Schema.Types.Mixed, default: null },
    reasons: { type: [String], default: [] },
    diffs: { type: [mongoose.Schema.Types.Mixed], default: [] }, // {field,a,b}
  },
  { timestamps: true }
);

ReconciliationItemSchema.index({ reconciliationId: 1, key: 1 });

module.exports = mongoose.model("ReconciliationItem", ReconciliationItemSchema);

