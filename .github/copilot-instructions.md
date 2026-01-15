# Copilot Instructions for YASH (Smart Reconciliation Visualizer)

## Project Overview
YASH is a full-stack financial data reconciliation application. Users upload two CSV/XLSX datasets, specify key and comparison fields, and the system identifies matches, mismatches, and missing records using configurable tolerance thresholds.

**Architecture**: Monorepo with separate `/client` (React + TypeScript + Vite) and `/server` (Express + MongoDB) directories.

## Key Workflows

### Development
```bash
npm run dev:client      # Vite dev server (port 5173)
npm run dev:server      # Express with --watch (port 5000)
npm run dev            # Runs server only
npm run build          # Builds client, installs dependencies
```

### Data Flow
1. **Upload**: Client → `/api/datasets/upload` (multipart) → Parses CSV/XLSX → Stores in MongoDB
2. **Reconcile**: Client sends keyFields, compareFields, amountTolerance → Backend reconciles in-memory → Saves Reconciliation + ReconciliationItems
3. **Query**: Client fetches `/api/reconcile/:id/items` with filtering/pagination

## Critical Patterns

### Amount Normalization (reconcile.js)
- **Field detection**: `field.toLowerCase().includes("amount")` triggers special handling
- **Parsing**: Strips currency symbols (`₹, $`) and commas before converting to number
- **Tolerance logic**: `Math.abs(a - b) > amountTolerance` determines mismatch
- **Invalid amounts**: Treated as field mismatch if either value is non-numeric

### Record Keying (reconcile.js: `makeKey()`)
- Keys built by concatenating keyFields with `" | "` delimiter
- All values normalized: trimmed, lowercased
- Empty keys skipped; missing/null fields = empty string in key

### Reconciliation Statuses (ReconciliationItem.js)
- `match`: All compareFields within tolerance
- `mismatch`: Key found but field differences exist
- `missing_in_b`: Key in A not found in B
- `missing_in_a`: Key in B not used by any A row

## File Structure

### Server
- [src/index.js](server/src/index.js) - Express setup, CORS, static file serving, routes mounting
- [src/db.js](server/src/db.js) - MongoDB connection
- [src/parseUpload.js](server/src/parseUpload.js) - CSV/XLSX parsing (auto-detects by extension)
- [src/reconcile.js](server/src/reconcile.js) - Core reconciliation logic (70+ lines of comparison)
- [src/models/](server/src/models/) - Dataset, Reconciliation, ReconciliationItem schemas
- [src/routes/datasets.js](server/src/routes/datasets.js) - POST /upload, GET /:id
- [src/routes/reconcile.js](server/src/routes/reconcile.js) - POST /, GET /:id/summary, GET /:id/items with filtering

### Client
- [src/App.tsx](client/src/App.tsx) - Main component, state management, API integration
- [src/components/DatasetUpload.tsx](client/src/components/DatasetUpload.tsx) - File upload + field selection
- [src/components/ReconciliationResults.tsx](client/src/components/ReconciliationResults.tsx) - Display + filtering

## Configuration & Environment
- `.env` (server): `PORT`, `MONGODB_URI`, `CLIENT_ORIGIN`, `MAX_UPLOAD_MB`
- Client hardcodes `API_BASE = 'http://localhost:5000/api'` (update for production)
- Frontend served from `/client/dist` by Express static middleware

## Common Tasks

### Adding a Comparison Field Type
1. Extend [reconcile.js](server/src/reconcile.js) `diffRecords()`: add field-specific logic before generic string comparison
2. Update client [components/DatasetUpload.tsx](client/src/components/DatasetUpload.tsx) field selector UI if needed
3. Add validation schema to [routes/reconcile.js](server/src/routes/reconcile.js) if new parameter required

### Filtering ReconciliationItems
- Use `/api/reconcile/:id/items?status=match&q=search&page=1&pageSize=25`
- Status: `match|mismatch|missing_in_a|missing_in_b` or `all`
- Search `q` scans key field (case-insensitive regex)
- Pagination via `page` and `pageSize`

### Handling Large Datasets
- Current implementation stores full rows in MongoDB (not production-ready)
- Upload limit: `MAX_UPLOAD_MB` (default 10)
- Items paginated (max 100 per page); reconciliation runs in-memory upfront

## Key Dependencies
- **Server**: Express 5, Mongoose 9, csv-parser, xlsx, zod (validation), multer (file upload), nanoid (ID generation)
- **Client**: React 19, Recharts (charts), TailwindCSS 3 (styling)

## Type Safety
- **Client**: Full TypeScript with `ReconciliationSummary` interface in [App.tsx](client/src/App.tsx)
- **Server**: Zod schema validation in routes; loose types in models (Mixed fields for row data)

## Testing Notes
- No test suite currently; manual integration testing recommended
- CORS enabled (`origin: true`) for local dev; restrict in production
- Error handling via Express middleware; check server logs for parse failures
