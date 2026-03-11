import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStoreSettings, updateStoreSettings } from '@/lib/db'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const qc = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: getStoreSettings,
  })

  const [form, setForm] = useState({
    storeName: 'Afínjú',
    whatsappNumber: '2347071861932',
    supportEmail: '',
    shippingFee: 5000,
    paystackPublicKey: '',
    instagramUrl: '',
    twitterUrl: '',
  })

  useEffect(() => {
    if (settings) setForm(prev => ({ ...prev, ...settings }))
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => updateStoreSettings(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-settings'] })
      toast.success('Settings saved.')
    },
    onError: () => toast.error('Failed to save settings.'),
  })

  const F = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="font-sans text-xs tracking-[0.12em] uppercase text-afinju-black/50">{label}</label>
      {children}
      {note && <p className="font-sans text-[10px] text-afinju-black/30">{note}</p>}
    </div>
  )

  const inputClass = "w-full border border-black/15 px-3 py-2.5 font-sans text-sm bg-white focus:outline-none focus:border-gold transition-colors"

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Store Settings</h1>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-luxury text-xs py-2.5 px-6 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span>
          ) : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-6">
        <h2 className="font-display text-xs tracking-[0.2em]">GENERAL</h2>
        <F label="Store Name">
          <input value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} className={inputClass} />
        </F>
        <F label="Support Email">
          <input value={form.supportEmail} onChange={e => setForm(f => ({ ...f, supportEmail: e.target.value }))} className={inputClass} />
        </F>
        <F label="WhatsApp Number" note="Include country code, no plus sign. e.g. 2347071861932">
          <input value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} className={inputClass} />
        </F>
        <F label="Flat Shipping Fee (₦)">
          <input type="number" value={form.shippingFee} onChange={e => setForm(f => ({ ...f, shippingFee: Number(e.target.value) }))} className={inputClass} />
        </F>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-6">
        <h2 className="font-display text-xs tracking-[0.2em]">PAYSTACK</h2>
        <div className="p-3 bg-yellow-50 border border-yellow-200">
          <p className="font-sans text-xs text-yellow-800">
            ⚠️ The Paystack Secret Key should NEVER be stored here. Set it as an environment variable in your Firebase Functions config.
            Only the public key (starts with pk_) is safe to store here.
          </p>
        </div>
        <F label="Paystack Public Key" note="Starts with pk_live_ or pk_test_">
          <input value={form.paystackPublicKey} onChange={e => setForm(f => ({ ...f, paystackPublicKey: e.target.value }))} className={inputClass} />
        </F>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-6">
        <h2 className="font-display text-xs tracking-[0.2em]">SOCIAL LINKS</h2>
        <F label="Instagram URL">
          <input value={form.instagramUrl} onChange={e => setForm(f => ({ ...f, instagramUrl: e.target.value }))} placeholder="https://instagram.com/afinju" className={inputClass} />
        </F>
        <F label="Twitter / X URL">
          <input value={form.twitterUrl} onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))} placeholder="https://twitter.com/afinju" className={inputClass} />
        </F>
      </div>
    </div>
  )
}
