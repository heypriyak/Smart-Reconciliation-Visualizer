import { useState } from 'react'
import DatasetUpload from './components/DatasetUpload'
import ReconciliationResults from './components/ReconciliationResults'
import './index.css'

const API_BASE = 'http://localhost:5000/api'

export interface ReconciliationSummary {
  reconciliationId: string
  summary: {
    matches: number
    mismatches: number
    missingInA: number
    missingInB: number
    totalA: number
    totalB: number
  }
}

function App() {
  const [reconciliation, setReconciliation] = useState<ReconciliationSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReconcile = async (reconcileData: {
    datasetAId: string
    datasetBId: string
    keyFields: string[]
    compareFields: string[]
    amountTolerance: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reconcileData),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Reconciliation failed')
      }

      const result = await response.json()
      setReconciliation({
        reconciliationId: result.reconciliationId,
        summary: result.summary,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to reconcile datasets')
    } finally {
      setLoading(false)
    }
  }

  const handleNewReconciliation = () => {
    setReconciliation(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Smart Reconciliation Visualizer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload two financial datasets, reconcile them, and explore matches, mismatches, and missing records.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!reconciliation ? (
          <DatasetUpload apiBase={API_BASE} loading={loading} onReconcile={handleReconcile} />
        ) : (
          <ReconciliationResults
            apiBase={API_BASE}
            reconciliation={reconciliation}
            onNewReconciliation={handleNewReconciliation}
          />
        )}
      </main>
    </div>
  )
}

export default App
