import { motion } from 'framer-motion'

interface ScarcityCounterProps {
  sold: number
  limit?: number
  total?: number  // legacy alias
  compact?: boolean
  large?: boolean
  className?: string
}

export default function ScarcityCounter({
  sold,
  limit,
  total,
  compact = false,
  large = false,
  className = '',
}: ScarcityCounterProps) {
  const cap = limit ?? total ?? 10
  const remaining = Math.max(0, cap - sold)
  const pct = cap > 0 ? (sold / cap) * 100 : 0
  const urgent = remaining <= 3

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-16 h-1 bg-black/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gold"
          />
        </div>
        <span className={`font-sans text-[10px] tracking-[0.15em] uppercase ${urgent ? 'text-red-600' : 'text-afinju-black/40'}`}>
          {remaining > 0 ? `${remaining}/${cap} left` : 'Sold Out'}
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs tracking-[0.15em] uppercase text-afinju-black/40">
          Launch Edition
        </span>
        <span className={`font-sans text-xs font-medium tracking-wider ${urgent ? 'text-red-600' : 'text-gold-dark'}`}>
          {remaining > 0 ? `${remaining}/${cap} Remaining` : 'Sold Out'}
        </span>
      </div>
      <div className={`${large ? 'h-2' : 'h-1'} bg-black/8 overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          className="h-full bg-gold"
        />
      </div>
      {urgent && remaining > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-sans text-xs text-red-600 tracking-wider"
        >
          ⚡ Only {remaining} unit{remaining !== 1 ? 's' : ''} left. Act now
        </motion.p>
      )}
      {remaining === 0 && (
        <p className="font-sans text-xs text-red-600 uppercase tracking-widest font-medium">
          Sold Out - Launch Edition Closed
        </p>
      )}
      {large && remaining > 0 && (
        <p className="font-sans text-sm text-afinju-black/60 text-center">
          <strong>{sold}</strong> of {cap} positions claimed.{' '}
          <span className="text-gold-dark font-medium">{remaining} remain.</span>{' '}
          Once it is closed, it is closed.
        </p>
      )}
    </div>
  )
}
