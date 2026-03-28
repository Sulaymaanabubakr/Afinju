import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/lib/db'
import { format } from 'date-fns'
import { ChevronDown, Download } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { exportDatasetAs, type ExportFormat } from '@/lib/adminExport'
import { useDismissiblePanel } from '@/hooks/useDismissiblePanel'

export default function AdminCustomersPage() {
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  useDismissiblePanel(exportMenuRef, exportOpen, () => setExportOpen(false))
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    refetchOnWindowFocus: true,
  })
  const exportRows = useMemo(
    () =>
      (users || []).map((u) => [
        u.displayName || '—',
        u.email || '—',
        u.phone || '—',
        u.role,
        format(u.createdAt, 'yyyy-MM-dd'),
      ]),
    [users]
  )

  const runExport = async (formatType: ExportFormat) => {
    if (!users?.length) {
      toast.error('No customers to export.')
      return
    }
    setExporting(true)
    setExportOpen(false)
    try {
      await exportDatasetAs(formatType, {
        fileBase: `afinju-customers-${Date.now()}`,
        title: 'AFINJU Customers Report',
        headers: ['Name', 'Email', 'Phone', 'Role', 'Joined'],
        rows: exportRows,
      })
      toast.success(`${formatType.toUpperCase()} exported.`)
    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Customers</h1>
          <p className="font-sans text-sm text-afinju-black/40">{users?.length || 0} registered accounts</p>
        </div>
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            disabled={exporting}
            className="flex items-center gap-2 font-sans text-xs tracking-wider uppercase border border-black/20 px-4 py-2 hover:border-gold transition-colors disabled:opacity-50"
          >
            <Download size={13} strokeWidth={1.5} />
            {exporting ? 'Exporting...' : 'Export'}
            <ChevronDown size={12} strokeWidth={1.8} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-black/10 shadow-lg z-20">
              {[
                ['pdf', 'Export as PDF'],
                ['excel', 'Export as Excel'],
                ['doc', 'Export as DOC'],
                ['csv', 'Export as CSV'],
                ['png', 'Export as PNG'],
                ['jpg', 'Export as JPG'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => runExport(value as ExportFormat)}
                  className="w-full text-left px-3 py-2 text-xs font-sans tracking-wide hover:bg-black/5 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-black/8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/5">
              {['Name', 'Email', 'Phone', 'Role', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-sans text-[10px] tracking-[0.15em] uppercase text-afinju-black/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(users || []).map(user => (
              <tr key={user.uid} className="hover:bg-black/2 transition-colors">
                <td className="px-4 py-3 font-sans text-sm font-medium">{user.displayName || '—'}</td>
                <td className="px-4 py-3 font-sans text-sm text-afinju-black/60">{user.email || '—'}</td>
                <td className="px-4 py-3 font-sans text-sm text-afinju-black/60">{user.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-sans text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                    user.role === 'admin' ? 'bg-gold/10 text-gold-dark' : 'bg-black/5 text-afinju-black/50'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-xs text-afinju-black/40">
                  {format(user.createdAt, 'MMM dd, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10" />)}</div>}
      </div>
    </div>
  )
}
