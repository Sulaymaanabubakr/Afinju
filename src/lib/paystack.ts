export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

export interface PaystackConfig {
  email: string
  amount: number  // kobo (NGN * 100)
  currency: 'NGN'
  reference: string
  metadata?: Record<string, unknown>
  onSuccess: (reference: string) => void
  onCancel: () => void
}

/** Generate a unique payment reference */
export function generateReference(prefix = 'AFJ'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/** Format NGN amount from kobo to display */
export function formatNGN(amount: number, inKobo = false): string {
  const nairaAmount = inKobo ? amount / 100 : amount
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(nairaAmount)
}

/**
 * Load Paystack inline script and open payment modal.
 * The actual popup is initiated here; verification happens server-side.
 */
export function openPaystackPopup(config: PaystackConfig): void {
  const handler = (window as any).PaystackPop?.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email || 'guest@afinju.com',
    amount: config.amount * 100, // convert to kobo
    currency: 'NGN',
    ref: config.reference,
    metadata: config.metadata,
    callback: (response: { reference: string }) => {
      config.onSuccess(response.reference)
    },
    onClose: config.onCancel,
  })

  handler?.openIframe()
}
