import React, { createContext, useContext, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'info'
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }

  const handleClose = (value: boolean) => {
    setIsOpen(false)
    if (resolver.current) resolver.current(value)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && options && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white border border-black/10 shadow-2xl overflow-hidden"
            >
              {/* Luxury Header */}
              <div className="bg-black/2 px-6 py-4 flex items-center justify-between border-b border-black/5">
                <span className="font-display text-[10px] tracking-[0.3em] uppercase text-afinju-black/40">Confirmation</span>
                <button onClick={() => handleClose(false)} className="text-afinju-black/30 hover:text-afinju-black transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-8">
                <div className="flex gap-5">
                  <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-none border ${
                    options.variant === 'danger' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gold/10 border-gold/20 text-gold'
                  }`}>
                    <AlertTriangle size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl mb-2">{options.title}</h3>
                    <p className="font-sans text-sm text-afinju-black/60 leading-relaxed">
                      {options.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-10">
                  <button
                    onClick={() => handleClose(false)}
                    className="flex-1 px-4 py-3 font-sans text-xs uppercase tracking-widest text-afinju-black/40 hover:text-afinju-black transition-colors border border-black/5 hover:border-black/15"
                  >
                    {options.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className={`flex-1 px-4 py-3 font-sans text-xs uppercase tracking-widest text-white transition-opacity ${
                      options.variant === 'danger' ? 'bg-red-600' : 'bg-black hover:bg-gold-dark'
                    }`}
                  >
                    {options.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>

              {/* Decorative Accent */}
              <div className="h-1 bg-gold w-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider')
  return context.confirm
}
