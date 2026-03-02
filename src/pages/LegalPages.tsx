// ─── Terms of Service ────────────────────────────────────────────────────────
export function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <Section title="1. Acceptance of Terms">
        By placing an order on AFINJU, you agree to be bound by these terms. If you do not agree, please do not use our website or services.
      </Section>
      <Section title="2. Products and Pricing">
        All prices are displayed in Nigerian Naira (₦). Prices are subject to change without notice. The launch edition price of ₦200,000 applies only to the first 10 units of the AFINJU Authority Set. Subsequent editions are priced at ₦250,000.
      </Section>
      <Section title="3. Orders and Payment">
        Orders are confirmed only upon receipt of successful payment verification via Paystack. We reserve the right to cancel any order in the event of inventory errors or payment fraud. You will be notified and fully refunded in such cases.
      </Section>
      <Section title="4. Custom Orders">
        Because each AFINJU set is made to your specified colour, shoe size, and head size, cancellations are not accepted once an order has been confirmed. Please review your selections carefully before completing checkout.
      </Section>
      <Section title="5. Delivery">
        Delivery timelines are estimates and may be affected by logistics conditions outside our control. AFINJU is not liable for delays caused by third-party courier services, though we will always assist in resolution.
      </Section>
      <Section title="6. Intellectual Property">
        All content on this website — including the AFINJU name, logo, photography, and copy — is the exclusive property of AFINJU and may not be reproduced, distributed, or used without written permission.
      </Section>
      <Section title="7. Governing Law">
        These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved under Nigerian jurisdiction.
      </Section>
    </LegalPage>
  )
}

// ─── Privacy Policy ──────────────────────────────────────────────────────────
export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="Information We Collect">
        We collect information you provide directly when placing an order: full name, phone number, alternative phone number, email address (optional), and delivery address. We also collect order preferences (shoe size, head size, colour).
      </Section>
      <Section title="How We Use Your Information">
        Your information is used to fulfil your order, update you on delivery status, and provide customer support. With your consent, we may contact you about future AFINJU collections. We do not sell, rent, or share your personal data with third parties for marketing purposes.
      </Section>
      <Section title="Payment Data">
        AFINJU does not store payment card details. All payment transactions are processed securely by Paystack, which is PCI-DSS compliant. Please refer to Paystack's privacy policy for details on how they handle payment data.
      </Section>
      <Section title="Data Security">
        Your data is stored on Firebase (Google Cloud), which maintains enterprise-grade security infrastructure. Access to customer data is restricted to authorised AFINJU staff only.
      </Section>
      <Section title="Your Rights">
        You may request access to, correction of, or deletion of your personal data at any time by contacting us via WhatsApp or email. We will respond within 5 business days.
      </Section>
      <Section title="Cookies">
        Our website uses essential cookies to maintain your cart session and authentication state. We do not use tracking or advertising cookies.
      </Section>
    </LegalPage>
  )
}

// ─── Shipping & Returns ───────────────────────────────────────────────────────
export function ShippingReturnsPage() {
  return (
    <LegalPage title="Shipping & Returns">
      <Section title="Delivery Coverage">
        We deliver to all 36 states of Nigeria and the FCT. International shipping is not currently available. All deliveries are handled through trusted Nigerian logistics partners.
      </Section>
      <Section title="Delivery Timeline">
        Lagos and Abuja: 3–5 business days. South-West states: 4–6 business days. Other states: 5–8 business days. These are estimates. Actual delivery may vary based on logistics availability in your area.
      </Section>
      <Section title="Shipping Fee">
        A flat-rate shipping fee of ₦5,000 applies to all orders nationwide. This fee covers careful packaging, insurance, and handling of your luxury box.
      </Section>
      <Section title="Returns Policy">
        As every AFINJU set is made to your specifications (colour, shoe size, head size), we do not accept returns based on change of preference or mind. However, if your item arrives damaged, defective, or does not match your confirmed order specifications, we will replace it at no cost. Contact us within 48 hours of delivery with photographic evidence.
      </Section>
      <Section title="Damaged or Incorrect Items">
        In the unlikely event your order arrives damaged or incorrect, contact us immediately via WhatsApp (+234 707 186 1932) with your order number and photos. We will arrange a replacement or full refund within 48 hours of confirmation.
      </Section>
      <Section title="Failed Delivery">
        If a delivery attempt fails and we are unable to reach you, the package will be held for 5 days before being returned. Re-delivery will incur an additional logistics fee. Please ensure your phone number and delivery address are accurate at checkout.
      </Section>
    </LegalPage>
  )
}

// ─── Shared Legal Layout ─────────────────────────────────────────────────────
function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <section className="bg-afinju-black text-afinju-cream py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl">{title}</h1>
          <p className="font-sans text-sm text-afinju-cream/40 mt-3">AFINJU · Last updated January 2024</p>
        </div>
      </section>
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">{children}</div>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-xl mb-3">{title}</h2>
      <p className="font-body text-base text-afinju-black/65 leading-relaxed">{children}</p>
    </div>
  )
}
