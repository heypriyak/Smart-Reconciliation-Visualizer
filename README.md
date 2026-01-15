# Smart Reconciliation Visualizer

A full-stack web application for comparing and reconciling datasets. Upload two CSV/Excel files and get detailed insights into matches, mismatches, and discrepancies between them.

## Features

✨ **Dataset Upload**

- Support for CSV and Excel files
- File size limit: 10MB
- Automatic header detection

🔍 **Reconciliation**

- Compare two datasets by key fields
- Configure comparison fields
- Set amount tolerance for numeric differences
- Real-time processing

📊 **Results Visualization**

- Summary statistics (matches, mismatches, missing records)
- Detailed item-by-item results
- Filter by status (matched, mismatched, missing)
- Search functionality
- Pagination support

## Tech Stack

**Frontend:**

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)

**Backend:**

- Node.js with Express
- MongoDB (data storage)
- Multer (file uploads)
- Zod (validation)

## Project Structure

```
yash/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main app
│   │   └── index.css      # Styles
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # MongoDB models
│   │   ├── index.js       # Server entry
│   │   ├── db.js          # Database config
│   │   └── reconcile.js   # Reconciliation logic
│   ├── package.json
│   └── .env               # Environment variables
└── package.json           # Root package.json
```

## Setup & Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- MongoDB (local or Atlas)

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/heypriyak/Smart-Reconciliation-Visualizer.git
cd Smart-Reconciliation-Visualizer
```

2. **Install dependencies**

```bash
npm run build
```

3. **Configure environment**

Create `server/.env` file:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_MB=10
```

4. **Run the application**

**Option A: Production mode** (recommended for testing)

```bash
npm start
```

Opens on `http://localhost:5000`

**Option B: Development mode** (with hot reload)

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Usage

### Step 1: Upload Dataset A

- Click "Upload Dataset A"
- Select a CSV or Excel file
- Optionally name your dataset
- Click "Upload"

### Step 2: Upload Dataset B

- Click "Upload Dataset B"
- Select another CSV or Excel file
- Click "Upload"

### Step 3: Configure Reconciliation

- **Key Fields**: Select columns to match records (e.g., "ID", "Account Number")
- **Compare Fields**: Select columns to compare values (e.g., "Amount", "Balance")
- **Tolerance**: Set tolerance for numeric differences (optional)

### Step 4: Run Reconciliation

- Click "Reconcile Datasets"
- View results with:
  - **Matched**: Records with matching keys and values
  - **Mismatched**: Records with matching keys but different values
  - **Missing in A**: Records only in Dataset B
  - **Missing in B**: Records only in Dataset A

## Environment Variables

| Variable        | Description               | Default                 |
| --------------- | ------------------------- | ----------------------- |
| `PORT`          | Server port               | `5000`                  |
| `MONGODB_URI`   | MongoDB connection string | Required                |
| `CLIENT_ORIGIN` | Frontend origin for CORS  | `http://localhost:5173` |
| `MAX_UPLOAD_MB` | Max file upload size      | `10`                    |

## API Endpoints

### Datasets

- `POST /api/datasets/upload` - Upload a dataset
- `GET /api/datasets/:id` - Get dataset details

### Reconciliation

- `POST /api/reconcile` - Start reconciliation
- `GET /api/reconcile/:id/summary` - Get reconciliation summary
- `GET /api/reconcile/:id/items` - Get reconciliation items (paginated)

## Deployment

### Replit

1. Fork the repository to Replit
2. Set environment variables in Replit secrets
3. Run `npm run build` to build the frontend
4. Click "Publish" to deploy (requires Replit Core)

### Other Platforms (Render, Railway, Fly.io, etc.)

1. Push code to GitHub
2. Connect repository to your deployment platform
3. Set environment variables
4. Configure build command: `npm run build`
5. Configure start command: `npm start`

## Performance Notes

⚠️ **Large Datasets**

- For files > 1000 rows, reconciliation may take a few seconds
- Consider splitting very large datasets
- Adjust `MAX_UPLOAD_MB` in `.env` as needed

## Troubleshooting

**CORS Errors**

- Ensure `CLIENT_ORIGIN` matches your frontend URL
- Check browser console for blocked requests

**MongoDB Connection Failed**

- Verify `MONGODB_URI` is correct
- Check network access rules in MongoDB Atlas
- Ensure IP whitelist includes your server

**File Upload Fails**

- Check file size doesn't exceed `MAX_UPLOAD_MB`
- Verify file format is CSV or Excel
- Check server disk space for upload directory

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Author

Sanuj Priya

## Support

For issues and feature requests, please open a GitHub issue.

---

**Live Demo**: [Replit Deployment](https://smart-reconciliation-visualizer-1--sanjupriya004.replit.app)
