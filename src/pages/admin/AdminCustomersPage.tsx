import { useQuery } from '@tanstack/react-query'
import { getAllUsers } from '@/lib/db'
import { format } from 'date-fns'
import { Phone, MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/utils'

export default function AdminCustomersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Customers</h1>
        <p className="font-sans text-sm text-afinju-black/40">{users?.length || 0} registered accounts</p>
      </div>

      <div className="bg-white border border-black/8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/5">
              {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => (
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
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.phone && (
                      <>
                        <a href={`tel:${user.phone}`} className="text-afinju-black/40 hover:text-afinju-black transition-colors">
                          <Phone size={13} strokeWidth={1.5} />
                        </a>
                        <a href={whatsappLink(user.phone, `Hello ${user.displayName || ''}, this is AFINJU.`)} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition-colors">
                          <MessageCircle size={13} strokeWidth={1.5} />
                        </a>
                      </>
                    )}
                  </div>
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
