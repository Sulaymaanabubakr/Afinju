import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { useAuthStore } from '@/store/auth'
import { createOrder, getRemainingUnits, getStoreSettings } from '@/lib/db'
import { openPaystackPopup, generateReference } from '@/lib/paystack'
import { formatPrice, BRAND_WHATSAPP } from '@/lib/utils'
import { cloudinaryUrl } from '@/lib/cloudinary'
import { httpsCallable } from 'firebase/functions'
import { functions, auth } from '@/lib/firebase'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PRODUCT_COLORS, SHOE_SIZES, HEAD_SIZES, type ProductColor } from '@/types'

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const schema = z.object({
  fullName: z.string().min(3, 'Enter your full name'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  altPhone: z.string().min(10, 'Enter an alternative phone number'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  fullAddress: z.string().min(10, 'Enter your full delivery address'),
  city: z.string().min(2, 'Enter your city'),
  state: z.string().min(2, 'Select your state'),
  landmark: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCartStore()
  const { user } = useAuthStore()
  
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: getStoreSettings,
  })

  const [processing, setProcessing] = useState(false)
  const subtotal = total()
  const shippingFee = settings?.shippingFee ?? 5000
  const orderTotal = subtotal + shippingFee
  const getLineId = (item: typeof items[number]) =>
    item.lineId || [item.productId, item.preferences?.preferredColor || '', item.preferences?.shoeSize || '', item.preferences?.headSize || ''].join(':')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email || '',
      fullName: user?.displayName || '',
      phone: user?.phone || '',
    },
  })

  if (!items.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="font-heading text-xl">Your cart is empty</p>
          <Link to="/shop" className="btn-luxury inline-block">Shop Now</Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    if (!user) { toast.error('Please sign in to continue'); return }
    if (processing) return
    if (!auth.currentUser) {
      toast.error('Your session expired. Please sign in again.')
      navigate('/login?return=%2Fcheckout')
      return
    }

    // Validate inventory before payment
    for (const item of items) {
      const remaining = await getRemainingUnits(item.productId)
      if (remaining < item.quantity) {
        toast.error(`Sorry, only ${remaining} unit(s) remain.`)
        return
      }
    }

    setProcessing(true)
    const reference = generateReference()

    // Create pending order securely
    let orderId: string
    let serverTotal: number
    try {
      // Ensure callable has a fresh ID token
      await auth.currentUser.getIdToken(true)

      const result = await createOrder({
        customerName: data.fullName,
        customerPhone: data.phone,
        customerAltPhone: data.altPhone,
        customerEmail: data.email || undefined,
        deliveryAddress: {
          fullAddress: data.fullAddress,
          city: data.city,
          state: data.state,
          landmark: data.landmark,
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          preferences: i.preferences!,
        })),
        notes: data.notes,
      })
      
      orderId = result.orderId
      serverTotal = result.total
    } catch (err: any) {
      const code = err?.code || err?.details?.code || ''
      const message = err?.message || err?.details || ''

      if (
        code === 'functions/unauthenticated' ||
        code === 'unauthenticated' ||
        code === 'auth/user-token-expired'
      ) {
        toast.error('Session expired. Please sign in again.')
        navigate('/login?return=%2Fcheckout')
      } else if (
        code === 'functions/not-found'
      ) {
        toast.error('Order service is unavailable. Please refresh and try again.')
      } else if (
        code === 'functions/failed-precondition' ||
        code === 'failed-precondition' ||
        code === 'functions/invalid-argument' ||
        code === 'invalid-argument'
      ) {
        const clean = typeof message === 'string' ? message.replace(/^.*?:\s*/, '') : ''
        toast.error(clean || 'Order validation failed. Please review your cart and try again.')
      } else {
        toast.error('Failed to create order securely. Please try again.')
      }
      setProcessing(false)
      return
    }

    // Open Paystack
    openPaystackPopup({
      email: data.email || `${data.phone}@afinju.guest`,
      amount: serverTotal,
      currency: 'NGN',
      reference,
      metadata: {
        orderId,
        userId: user.uid,
        custom_fields: [
          { display_name: 'Order ID', variable_name: 'order_id', value: orderId },
          { display_name: 'Customer', variable_name: 'customer', value: data.fullName },
        ],
      },
      onSuccess: async (ref) => {
        try {
          // Verify payment server-side
          const verifyPayment = httpsCallable(functions, 'verifyPayment')
          await verifyPayment({ reference: ref, orderId })
          clearCart()
          toast.success('Payment confirmed! Your order is placed.')
          navigate(`/order-confirmation/${orderId}`)
        } catch (err) {
          toast.error('Payment verification failed. Contact support with your reference: ' + ref)
          navigate(`/order-confirmation/${orderId}`)
        }
      },
      onCancel: () => {
        toast('Payment cancelled. Your order is saved, you can retry.', { icon: 'ℹ️' })
        setProcessing(false)
      },
    })
  }

  return (
    <div className="min-h-screen bg-afinju-offwhite py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="section-label">Finalise Your Order</p>
          <h1 className="font-heading text-3xl">Checkout</h1>
          <div className="gold-rule mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              {/* Personal Details */}
              <section>
                <h2 className="font-display text-xs tracking-[0.25em] mb-8 pb-3 border-b border-black/8">
                  YOUR DETAILS
                </h2>
                <div className="space-y-8">
                  <Field label="Full Name *" error={errors.fullName?.message}>
                    <input {...register('fullName')} placeholder="Enter your full name" className="input-luxury" />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Phone Number *" error={errors.phone?.message}>
                      <input {...register('phone')} placeholder="+234 800 000 0000" className="input-luxury" />
                    </Field>
                    <Field label="Alternative Phone *" error={errors.altPhone?.message}>
                      <input {...register('altPhone')} placeholder="+234 800 000 0001" className="input-luxury" />
                    </Field>
                  </div>
                  <Field label="Email Address (Optional)" error={errors.email?.message}>
                    <input {...register('email')} type="email" placeholder="For order updates" className="input-luxury" />
                  </Field>
                </div>
              </section>

              {/* Delivery */}
              <section>
                <h2 className="font-display text-xs tracking-[0.25em] mb-8 pb-3 border-b border-black/8">
                  DELIVERY ADDRESS
                </h2>
                <div className="space-y-8">
                  <Field label="Full Address *" error={errors.fullAddress?.message}>
                    <textarea
                      {...register('fullAddress')}
                      rows={3}
                      placeholder="House number, street name, area"
                      className="input-luxury resize-none"
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="City *" error={errors.city?.message}>
                      <input {...register('city')} placeholder="e.g. Lagos" className="input-luxury" />
                    </Field>
                    <Field label="State *" error={errors.state?.message}>
                      <div className="relative">
                        <select {...register('state')} className="input-luxury appearance-none cursor-pointer">
                          <option value="">Select state</option>
                          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 bottom-3 text-afinju-black/40 pointer-events-none" />
                      </div>
                    </Field>
                  </div>
                  <Field label="Landmark / Nearest Bus Stop (Optional)">
                    <input {...register('landmark')} placeholder="Helps our delivery team find you" className="input-luxury" />
                  </Field>
                </div>
              </section>

              {/* Notes */}
              <section>
                <h2 className="font-display text-xs tracking-[0.25em] mb-8 pb-3 border-b border-black/8">
                  SPECIAL INSTRUCTIONS (OPTIONAL)
                </h2>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Any notes for your order?"
                  className="input-luxury resize-none w-full"
                />
              </section>

              <button
                type="submit"
                disabled={processing}
                className="btn-gold w-full py-5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock size={14} />
                    Pay {formatPrice(orderTotal)} Securely
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-28">
              <div className="bg-afinju-cream p-8 space-y-6">
                <h2 className="font-display text-xs tracking-[0.25em]">ORDER SUMMARY</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={getLineId(item)} className="flex gap-4">
                      <div className="w-16 h-20 bg-white overflow-hidden flex-shrink-0">
                        <img
                          src={cloudinaryUrl(item.productImage, { width: 128, height: 160 })}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm leading-tight">{item.productName}</p>
                        {item.preferences && (
                          <p className="font-sans text-xs text-afinju-black/50 mt-1">
                            {item.preferences.preferredColor} · Shoe {item.preferences.shoeSize} · Head {item.preferences.headSize}
                          </p>
                        )}
                        <p className="font-sans text-xs text-afinju-black/50">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-sans text-sm font-medium flex-shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/10 pt-4 space-y-3">
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-afinju-black/60">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-sm">
                    <span className="text-afinju-black/60">Shipping</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between font-heading text-xl border-t border-black/10 pt-3">
                    <span>Total</span>
                    <span>{formatPrice(orderTotal)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Lock size={12} className="text-gold" strokeWidth={2} />
                  <p className="font-sans text-xs text-afinju-black/50">
                    Secured by Paystack. Card, Bank, USSD available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="font-sans text-xs tracking-[0.12em] uppercase text-afinju-black/50">{label}</label>
      {children}
      {error && <p className="font-sans text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
