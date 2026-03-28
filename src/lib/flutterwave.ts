export const FLW_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY

export interface FlutterwaveConfig {
  email: string
  amount: number   // NGN (NOT kobo — Flutterwave takes whole naira)
  currency: 'NGN'
  txRef: string
  customerName?: string
  customerPhone?: string
  metadata?: Record<string, unknown>
  onSuccess: (transactionId: string, txRef: string) => void
  onCancel: () => void
}

/** Generate a unique payment reference */
export function generateReference(prefix = 'AFJ'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/** Format NGN amount to display */
export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Open Flutterwave inline payment modal.
 * Requires the Flutterwave inline script to be loaded first.
 */
export function openFlutterwaveModal(config: FlutterwaveConfig): void {
  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout

  if (!FlutterwaveCheckout) {
    console.error('Flutterwave inline script not loaded')
    config.onCancel()
    return
  }

  FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: config.txRef,
    amount: config.amount,
    currency: config.currency,
    payment_options: 'card, banktransfer, ussd',
    customer: {
      email: config.email,
      name: config.customerName || '',
      phone_number: config.customerPhone || '',
    },
    meta: config.metadata,
    customizations: {
      title: 'AFÍNJÚ',
      description: 'Premium Nigerian Craftsmanship',
      logo: 'https://afinju247.com/logo.png',
    },
    callback: (response: { transaction_id: number; tx_ref: string; status: string }) => {
      if (response.status === 'successful' || response.status === 'completed') {
        config.onSuccess(String(response.transaction_id), response.tx_ref)
      } else {
        config.onCancel()
      }
    },
    onclose: () => {
      config.onCancel()
    },
  })
}
