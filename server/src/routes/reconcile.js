const express = require("express");
const { z } = require("zod");
const Dataset = require("../models/Dataset");
const Reconciliation = require("../models/Reconciliation");
const ReconciliationItem = require("../models/ReconciliationItem");
const { reconcileRows } = require("../reconcile");

const router = express.Router();

const reconcileSchema = z.object({
  datasetAId: z.string().min(1),
  datasetBId: z.string().min(1),
  keyFields: z.array(z.string().min(1)).min(1),
  compareFields: z.array(z.string().min(1)).default(["amount"]),
  amountTolerance: z.number().nonnegative().default(0),
});

router.post("/", async (req, res, next) => {
  try {
    const payload = reconcileSchema.parse(req.body);
    const [a, b] = await Promise.all([
      Dataset.findById(payload.datasetAId).lean(),
      Dataset.findById(payload.datasetBId).lean(),
    ]);
    if (!a || !b) return res.status(404).json({ error: "Dataset not found" });

    const { summary, items } = reconcileRows({
      rowsA: a.rows || [],
      rowsB: b.rows || [],
      keyFields: payload.keyFields,
      compareFields: payload.compareFields,
      amountTolerance: payload.amountTolerance,
    });

    const reco = await Reconciliation.create({
      datasetA: a._id,
      datasetB: b._id,
      keyFields: payload.keyFields,
      compareFields: payload.compareFields,
      amountTolerance: payload.amountTolerance,
      summary,
    });

    // Bulk insert items
    await ReconciliationItem.insertMany(
      items.map((it) => ({ ...it, reconciliationId: reco._id })),
      { ordered: false }
    );

    res.json({ reconciliationId: reco._id, summary });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/summary", async (req, res, next) => {
  try {
    const reco = await Reconciliation.findById(req.params.id).lean();
    if (!reco) return res.status(404).json({ error: "Reconciliation not found" });
    res.json({ reconciliationId: reco._id, ...reco });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/items", async (req, res, next) => {
  try {
    const reconciliationId = req.params.id;
    const status = req.query.status ? String(req.query.status) : null;
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : "";
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize || 25)));

    const filter = { reconciliationId };
    if (status && status !== "all") filter.status = status;
    if (q) filter.key = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const [total, items] = await Promise.all([
      ReconciliationItem.countDocuments(filter),
      ReconciliationItem.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({ total, page, pageSize, items });
  } catch (e) {
    next(e);
  }
});

module.exports = router;

