import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReconciliationSummary } from '../App'

interface Props {
  apiBase: string
  reconciliation: ReconciliationSummary
  onNewReconciliation: () => void
}

type ItemStatus = 'all' | 'match' | 'mismatch' | 'missing_in_a' | 'missing_in_b'

type RecoItem = {
  _id: string
  status: ItemStatus
  key: string
  recordA: Record<string, unknown> | null
  recordB: Record<string, unknown> | null
  reasons: string[]
}

export default function ReconciliationResults({ apiBase, reconciliation, onNewReconciliation }: Props) {
  const [items, setItems] = useState<RecoItem[]>([])
  const [statusFilter, setStatusFilter] = useState<ItemStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const summary = reconciliation.summary

  const loadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search.trim()) params.set('q', search.trim())
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    const res = await fetch(`${apiBase}/reconcile/${reconciliation.reconciliationId}/items?${params.toString()}`)
    if (!res.ok) return
    const data = await res.json()
    setItems(data.items || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => {
    loadItems().catch(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page])

  const chartData = [
    { name: 'Matches', value: summary.matches },
    { name: 'Mismatches', value: summary.mismatches },
    { name: 'Missing in A', value: summary.missingInA },
    { name: 'Missing in B', value: summary.missingInB },
  ]

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reconciliation summary</h2>
            <p className="mt-1 text-sm text-slate-500">
              {summary.totalA} records in Dataset A, {summary.totalB} records in Dataset B.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewReconciliation}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            New reconciliation
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Matches" value={summary.matches} tone="success" />
          <SummaryCard label="Mismatches" value={summary.mismatches} tone="warning" />
          <SummaryCard label="Missing in A" value={summary.missingInA} tone="neutral" />
          <SummaryCard label="Missing in B" value={summary.missingInB} tone="neutral" />
        </div>

        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Record-level results</h2>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value as ItemStatus)
              }}
              className="rounded-md border-slate-300 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="all">All statuses</option>
              <option value="match">Matches</option>
              <option value="mismatch">Mismatches</option>
              <option value="missing_in_a">Missing in A</option>
              <option value="missing_in_b">Missing in B</option>
            </select>

            <input
              type="search"
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Search by key…"
              className="w-48 rounded-md border-slate-300 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="max-h-[420px] overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Key
                  </th>
                  <th className="sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="sticky top-0 z-10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reasons / differences
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                      No records found for this filter.
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 align-top font-mono text-xs text-slate-800">
                        {item.key}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <StatusPill status={item.status} />
                      </td>
                      <td className="px-3 py-2 align-top">
                        {item.reasons.length > 0 ? (
                          <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                            {item.reasons.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-500">No differences</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing page {page} of {totalPages} ({total} records)
          </span>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'warning' | 'neutral'
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
      : tone === 'warning'
      ? 'bg-amber-50 text-amber-800 border-amber-100'
      : 'bg-slate-50 text-slate-800 border-slate-100'

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, { label: string; className: string }> = {
    all: { label: 'All', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    match: { label: 'Match', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    mismatch: { label: 'Mismatch', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    missing_in_a: { label: 'Missing in A', className: 'bg-slate-50 text-slate-700 border-slate-200' },
    missing_in_b: { label: 'Missing in B', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  }

  const cfg = map[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

