import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSiteContent, updateSiteContent } from '@/lib/db'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function ContentField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-sans text-xs tracking-[0.12em] uppercase text-afinju-black/50">{label}</label>
      {children}
    </div>
  )
}

function ContentToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-sans text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${checked ? 'bg-gold' : 'bg-black/15'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function AdminContentPage() {
  const qc = useQueryClient()
  const { data: content } = useQuery({ queryKey: ['site-content'], queryFn: getSiteContent })

  const [form, setForm] = useState({
    announcementEnabled: true,
    announcementText: 'Only Ten Men Will Own This Launch Edition · Once It Is Closed, It Is Closed · Afínjú — Authority Set',
    heroHeadline: 'Afínjú is not for you if you cannot handle attention.',
    heroSubheadline: 'The authority set for the man who understands that standards are not negotiable.',
    heroCta: 'Secure Your Position',
    scarcityEnabled: true,
    scarcityText: 'Only 10 units available. Once it is closed, it is closed.',
  })

  useEffect(() => {
    if (content) {
      setForm({
        announcementEnabled: content.announcementBar?.enabled ?? true,
        announcementText: content.announcementBar?.text ?? form.announcementText,
        heroHeadline: content.hero?.headline ?? form.heroHeadline,
        heroSubheadline: content.hero?.subheadline ?? form.heroSubheadline,
        heroCta: content.hero?.ctaText ?? form.heroCta,
        scarcityEnabled: content.scarcityBanner?.enabled ?? true,
        scarcityText: content.scarcityBanner?.text ?? form.scarcityText,
      })
    }
  }, [content])

  const saveMutation = useMutation({
    mutationFn: () => updateSiteContent({
      announcementBar: { enabled: form.announcementEnabled, text: form.announcementText },
      hero: {
        headline: form.heroHeadline,
        subheadline: form.heroSubheadline,
        ctaText: form.heroCta,
        imageUrl: content?.hero?.imageUrl || '',
      },
      scarcityBanner: { enabled: form.scarcityEnabled, text: form.scarcityText },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content'] })
      qc.invalidateQueries({ queryKey: ['homepage-content'] })
      toast.success('Content updated.')
    },
    onError: () => toast.error('Failed to save content.'),
  })

  const inputClass = "w-full border border-black/15 px-3 py-2.5 font-sans text-sm bg-white focus:outline-none focus:border-gold transition-colors"
  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Content Management</h1>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-luxury text-xs py-2.5 px-6 disabled:opacity-50">
          {saveMutation.isPending ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span> : 'Save Content'}
        </button>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-5">
        <h2 className="font-display text-xs tracking-[0.2em]">ANNOUNCEMENT BAR</h2>
        <ContentToggle label="Show announcement bar" checked={form.announcementEnabled} onChange={v => setForm(f => ({ ...f, announcementEnabled: v }))} />
        <ContentField label="Announcement Text">
          <textarea value={form.announcementText} onChange={e => setForm(f => ({ ...f, announcementText: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
        </ContentField>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-5">
        <h2 className="font-display text-xs tracking-[0.2em]">HERO SECTION</h2>
        <ContentField label="Headline">
          <textarea value={form.heroHeadline} onChange={e => setForm(f => ({ ...f, heroHeadline: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
        </ContentField>
        <ContentField label="Sub-headline">
          <textarea value={form.heroSubheadline} onChange={e => setForm(f => ({ ...f, heroSubheadline: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
        </ContentField>
        <ContentField label="CTA Button Text">
          <input value={form.heroCta} onChange={e => setForm(f => ({ ...f, heroCta: e.target.value }))} className={inputClass} />
        </ContentField>
      </div>

      <div className="bg-white border border-black/8 p-8 space-y-5">
        <h2 className="font-display text-xs tracking-[0.2em]">SCARCITY BANNER</h2>
        <ContentToggle label="Show scarcity banner" checked={form.scarcityEnabled} onChange={v => setForm(f => ({ ...f, scarcityEnabled: v }))} />
        <ContentField label="Scarcity Text">
          <input value={form.scarcityText} onChange={e => setForm(f => ({ ...f, scarcityText: e.target.value }))} className={inputClass} />
        </ContentField>
      </div>
    </div>
  )
}
