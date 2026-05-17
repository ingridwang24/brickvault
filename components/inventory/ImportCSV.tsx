'use client'
import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function ImportCSV({ onSuccess, onCancel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<number | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      // Skip header row
      setPreview(rows.slice(1, 6))
      setResult(null)
      setError('')
    }
    reader.readAsText(file)
  }

  function parseCSV(text: string): string[][] {
    const rows: string[][] = []
    const lines = text.split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      const cols: string[] = []
      let inQuote = false, col = ''
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c === '"') { inQuote = !inQuote }
        else if (c === ',' && !inQuote) { cols.push(col); col = '' }
        else { col += c }
      }
      cols.push(col)
      rows.push(cols)
    }
    return rows
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setImporting(true)
    setError('')
    const text = await file.text()
    const rows = parseCSV(text).slice(1) // skip header
    try {
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.inserted)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-400">
        Upload your existing spreadsheet CSV. Columns expected:{' '}
        <span className="text-slate-300">Title, Set, Theme, Description, Number Available, Current Market Unit Value, Discount Offer Value, Condition Note, Total Value</span>
      </p>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-yellow-400/50 rounded-xl p-8 cursor-pointer transition-colors">
        <Upload size={24} className="text-slate-500 mb-2" />
        <span className="text-sm text-slate-400">Click to select CSV file</span>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </label>

      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <p className="text-xs text-slate-500 px-3 pt-2">Preview (first 5 rows):</p>
          <table className="w-full text-xs text-slate-300">
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="px-3 py-1.5 text-slate-100">{row[0]}</td>
                  <td className="px-3 py-1.5 text-yellow-400">{row[1]}</td>
                  <td className="px-3 py-1.5 text-slate-400">{row[2]}</td>
                  <td className="px-3 py-1.5 text-slate-400">qty: {row[4]}</td>
                  <td className="px-3 py-1.5 text-emerald-400">{row[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result !== null && (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-lg px-4 py-3 text-emerald-400 text-sm">
          ✓ Successfully imported <strong>{result}</strong> sets into inventory.
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={result !== null ? onSuccess : onCancel}>
          {result !== null ? 'Done' : 'Cancel'}
        </Button>
        {result === null && (
          <Button
            variant="primary"
            onClick={handleImport}
            loading={importing}
            disabled={!fileRef.current?.files?.length && preview.length === 0}
          >
            <Upload size={14} /> Import Sets
          </Button>
        )}
      </div>
    </div>
  )
}
