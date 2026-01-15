const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const xlsx = require("xlsx");

function guessFileType(filename) {
  const ext = path.extname(filename || "").toLowerCase();
  if (ext === ".csv") return "csv";
  if (ext === ".xlsx" || ext === ".xls") return "xlsx";
  return null;
}

function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headers = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("headers", (h) => {
        headers = h;
      })
      .on("data", (data) => rows.push(data))
      .on("end", () => resolve({ headers, rows }))
      .on("error", reject);
  });
}

function parseXlsx(filePath) {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

async function parseUploadedFile({ filePath, originalname }) {
  const type = guessFileType(originalname);
  if (!type) {
    const err = new Error("Unsupported file type. Please upload a CSV or XLSX file.");
    err.status = 400;
    throw err;
  }
  if (type === "csv") return { fileType: "csv", ...(await parseCsv(filePath)) };
  return { fileType: "xlsx", ...(await parseXlsx(filePath)) };
}

module.exports = { parseUploadedFile, guessFileType };

