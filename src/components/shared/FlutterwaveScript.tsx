import { useEffect } from 'react'

export function FlutterwaveScript() {
  useEffect(() => {
    if (document.getElementById('flutterwave-script')) return
    const script = document.createElement('script')
    script.id = 'flutterwave-script'
    script.src = 'https://checkout.flutterwave.com/v3.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  return null
}
