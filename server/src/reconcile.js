function normalizeValue(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function normalizeAmount(v) {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).replace(/[,₹$]/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function makeKey(record, keyFields) {
  return keyFields.map((f) => normalizeValue(record?.[f])).join(" | ").toLowerCase();
}

function diffRecords(a, b, compareFields, amountTolerance) {
  const diffs = [];
  const reasons = [];

  for (const field of compareFields) {
    const av = a?.[field];
    const bv = b?.[field];

    if (field.toLowerCase().includes("amount")) {
      const an = normalizeAmount(av);
      const bn = normalizeAmount(bv);
      if (an === null || bn === null) {
        if (normalizeValue(av) !== normalizeValue(bv)) {
          diffs.push({ field, a: av, b: bv });
          reasons.push(`Invalid/missing amount in ${an === null ? "A" : "B"}`);
        }
      } else if (Math.abs(an - bn) > amountTolerance) {
        diffs.push({ field, a: an, b: bn });
        reasons.push(`Amount differs by ${(an - bn).toFixed(2)} (tolerance ${amountTolerance})`);
      }
      continue;
    }

    const as = normalizeValue(av);
    const bs = normalizeValue(bv);
    if (as !== bs) {
      diffs.push({ field, a: av, b: bv });
      reasons.push(`${field} mismatch`);
    }
  }

  return { diffs, reasons };
}

/**
 * Reconcile dataset A against dataset B.
 * Strategy:
 * - Build a map of B by key (first occurrence).
 * - For each A row, find B row by key.
 *   - If not found => missing_in_b
 *   - If found and all compareFields within tolerance => match
 *   - Else => mismatch (+ reasons)
 * - Remaining B keys not used => missing_in_a
 */
function reconcileRows({ rowsA, rowsB, keyFields, compareFields, amountTolerance = 0 }) {
  const bMap = new Map();
  for (const r of rowsB) {
    const key = makeKey(r, keyFields);
    if (!key) continue;
    if (!bMap.has(key)) bMap.set(key, { record: r, used: false });
  }

  const items = [];
  let matches = 0;
  let mismatches = 0;
  let missingInA = 0;
  let missingInB = 0;

  for (const a of rowsA) {
    const key = makeKey(a, keyFields);
    if (!key) continue;

    const hit = bMap.get(key);
    if (!hit) {
      missingInB += 1;
      items.push({
        status: "missing_in_b",
        key,
        recordA: a,
        recordB: null,
        reasons: ["No matching key in dataset B"],
        diffs: [],
      });
      continue;
    }

    hit.used = true;
    const { diffs, reasons } = diffRecords(a, hit.record, compareFields, amountTolerance);
    if (diffs.length === 0) {
      matches += 1;
      items.push({
        status: "match",
        key,
        recordA: a,
        recordB: hit.record,
        reasons: [],
        diffs: [],
      });
    } else {
      mismatches += 1;
      items.push({
        status: "mismatch",
        key,
        recordA: a,
        recordB: hit.record,
        reasons,
        diffs,
      });
    }
  }

  for (const [key, v] of bMap.entries()) {
    if (!v.used) {
      missingInA += 1;
      items.push({
        status: "missing_in_a",
        key,
        recordA: null,
        recordB: v.record,
        reasons: ["No matching key in dataset A"],
        diffs: [],
      });
    }
  }

  return {
    summary: {
      matches,
      mismatches,
      missingInA,
      missingInB,
      totalA: rowsA.length,
      totalB: rowsB.length,
    },
    items,
  };
}

module.exports = { reconcileRows, makeKey, normalizeAmount };

