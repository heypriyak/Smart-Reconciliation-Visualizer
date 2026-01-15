import { useState } from 'react'

type UploadedDataset = {
  datasetId: string
  name: string
  originalFilename: string
  headers: string[]
  rowCount: number
}

interface Props {
  apiBase: string
  loading: boolean
  onReconcile: (data: {
    datasetAId: string
    datasetBId: string
    keyFields: string[]
    compareFields: string[]
    amountTolerance: number
  }) => void
}

export default function DatasetUpload({ apiBase, loading, onReconcile }: Props) {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [datasetA, setDatasetA] = useState<UploadedDataset | null>(null)
  const [datasetB, setDatasetB] = useState<UploadedDataset | null>(null)
  const [selectedKeyField, setSelectedKeyField] = useState<string>('')
  const [selectedCompareFields, setSelectedCompareFields] = useState<string[]>([])
  const [tolerance, setTolerance] = useState<number>(0)
  const [stepError, setStepError] = useState<string | null>(null)

  const uploadDataset = async (file: File, which: 'A' | 'B') => {
    setStepError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', which === 'A' ? 'Dataset A' : 'Dataset B')

    const res = await fetch(`${apiBase}/datasets/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to upload dataset')
    }

    const data = (await res.json()) as UploadedDataset
    if (which === 'A') setDatasetA(data)
    else setDatasetB(data)

    return data
  }

  const handleUploadClick = async () => {
    try {
      if (!fileA || !fileB) {
        setStepError('Please select both Dataset A and Dataset B files.')
        return
      }
      await uploadDataset(fileA, 'A')
      const uploadedB = await uploadDataset(fileB, 'B')

      // Default key + compare fields from Dataset B headers
      if (uploadedB.headers.length > 0) {
        setSelectedKeyField(uploadedB.headers[0])
        setSelectedCompareFields(
          uploadedB.headers.filter((h) => h.toLowerCase().includes('amount') || h === uploadedB.headers[1])
        )
      }
    } catch (e: any) {
      setStepError(e.message || 'Upload failed')
    }
  }

  const toggleCompareField = (field: string) => {
    setSelectedCompareFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    )
  }

  const handleReconcileClick = () => {
    if (!datasetA || !datasetB) {
      setStepError('Please upload both datasets first.')
      return
    }
    if (!selectedKeyField) {
      setStepError('Select at least one key field.')
      return
    }
    if (selectedCompareFields.length === 0) {
      setStepError('Select at least one field to compare.')
      return
    }
    onReconcile({
      datasetAId: datasetA.datasetId,
      datasetBId: datasetB.datasetId,
      keyFields: [selectedKeyField],
      compareFields: selectedCompareFields,
      amountTolerance: tolerance,
    })
  }

  const headers = datasetB?.headers || datasetA?.headers || []

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">1. Upload datasets</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload two CSV or Excel files. For example, a purchase register and a sales register.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Dataset A (e.g., Purchase register)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFileA(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />
            {datasetA && (
              <p className="text-xs text-slate-500">
                Uploaded: <span className="font-medium">{datasetA.originalFilename}</span> (
                {datasetA.rowCount} rows)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Dataset B (e.g., Sales register)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFileB(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-500"
            />
            {datasetB && (
              <p className="text-xs text-slate-500">
                Uploaded: <span className="font-medium">{datasetB.originalFilename}</span> (
                {datasetB.rowCount} rows)
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={loading}
          className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Uploading…' : 'Upload & Preview'}
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">2. Configure reconciliation</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose the unique key field and which fields to compare between the two datasets.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Key field</label>
            <select
              value={selectedKeyField}
              onChange={(e) => setSelectedKeyField(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500"
            >
              <option value="">Select key field</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Fields to compare</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {headers.length === 0 && (
                <p className="text-xs text-slate-400">
                  Upload datasets to see available fields.
                </p>
              )}
              {headers.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleCompareField(h)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedCompareFields.includes(h)
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-slate-700">
              Amount tolerance
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value) || 0)}
              className="w-28 rounded-md border-slate-300 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
            <span className="text-xs text-slate-500">Allowed difference between amounts</span>
          </div>

          <button
            type="button"
            onClick={handleReconcileClick}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? 'Reconciling…' : 'Run reconciliation'}
          </button>
        </div>

        {stepError && (
          <p className="mt-3 text-sm text-red-600">
            {stepError}
          </p>
        )}
      </section>
    </div>
  )
}

