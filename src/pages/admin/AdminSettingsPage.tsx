import { getStoreSettings, updateStoreSettings, sendTestEmail } from '@/lib/db'
import { Loader2, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function SettingsField({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-sans text-xs tracking-[0.12em] uppercase text-afinju-black/50">{label}</label>
      {children}
      {note && <p className="font-sans text-[10px] text-afinju-black/30">{note}</p>}
    </div>
  )
}

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
    instagramUrl: '',
    twitterUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    whatsappUrl: '',
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
  
  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: () => toast.success('Test notification sent to your email.'),
    onError: (error: any) => toast.error(`Test failed: ${error.message}`),
  })

  const inputClass = "w-full border border-black/15 px-3 py-2.5 font-sans text-sm bg-white focus:outline-none focus:border-gold transition-colors"

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Store Settings</h1>
        <div className="flex gap-3">
          <button
            onClick={() => testEmailMutation.mutate()}
            disabled={testEmailMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-black/5 hover:bg-black/10 border border-black/10 transition-colors font-sans text-xs uppercase tracking-widest text-afinju-black/60 disabled:opacity-50"
          >
            {testEmailMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Send Test Notif
          </button>
          
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
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-6">
        <h2 className="font-display text-xs tracking-[0.2em]">GENERAL</h2>
        <SettingsField label="Store Name">
          <input value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} className={inputClass} />
        </SettingsField>
        <SettingsField label="Support Email">
          <input value={form.supportEmail} onChange={e => setForm(f => ({ ...f, supportEmail: e.target.value }))} className={inputClass} />
        </SettingsField>
        <SettingsField label="WhatsApp Number" note="Include country code, no plus sign. e.g. 2347071861932">
          <input value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} className={inputClass} />
        </SettingsField>
        <SettingsField label="Flat Shipping Fee (₦)">
          <input type="number" value={form.shippingFee} onChange={e => setForm(f => ({ ...f, shippingFee: Number(e.target.value) }))} className={inputClass} />
        </SettingsField>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-6">
        <h2 className="font-display text-xs tracking-[0.2em]">SOCIAL LINKS</h2>
        <SettingsField label="WhatsApp Link">
          <input value={form.whatsappUrl} onChange={e => setForm(f => ({ ...f, whatsappUrl: e.target.value }))} placeholder="https://wa.me/2347071861932" className={inputClass} />
        </SettingsField>
        <SettingsField label="Instagram URL">
          <input value={form.instagramUrl} onChange={e => setForm(f => ({ ...f, instagramUrl: e.target.value }))} placeholder="https://instagram.com/afinju" className={inputClass} />
        </SettingsField>
        <SettingsField label="Twitter / X URL">
          <input value={form.twitterUrl} onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))} placeholder="https://twitter.com/afinju" className={inputClass} />
        </SettingsField>
        <SettingsField label="Facebook URL">
          <input value={form.facebookUrl} onChange={e => setForm(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="https://facebook.com/afinju" className={inputClass} />
        </SettingsField>
        <SettingsField label="TikTok URL">
          <input value={form.tiktokUrl} onChange={e => setForm(f => ({ ...f, tiktokUrl: e.target.value }))} placeholder="https://tiktok.com/@afinju" className={inputClass} />
        </SettingsField>
      </div>
    </div>
  )
}
