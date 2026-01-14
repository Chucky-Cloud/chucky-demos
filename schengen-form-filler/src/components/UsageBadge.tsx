import { useState, useEffect, useCallback } from 'react'

// Main Chucky API for usage tracking
const CHUCKY_API_URL = 'https://conjure.chucky.cloud'
// Demo payment worker
const PAYMENT_API_URL = 'https://schengen-demo-payments.daniel-9e8.workers.dev'

interface UsageData {
  ai: {
    used: number
    remaining: number
    budget: number
  }
  allowed: boolean
}

interface Props {
  token: string
  refreshTrigger?: number
  onTokenReceived?: (token: string) => void
}

// Pricing tiers - amount in microdollars for the token budget
const PRICING_TIERS = [
  { label: '$1', price: '$0.99', budget: 1_000_000, productId: 'pdt_0NWHVQ5pPA0BnHNhZwjNF', enabled: true },
  { label: '$5', price: '$4.99', budget: 5_000_000, productId: 'pdt_demo_5', enabled: false },
  { label: '$20', price: '$17.99', budget: 20_000_000, productId: 'pdt_demo_20', popular: true, enabled: false },
  { label: '$50', price: '$39.99', budget: 50_000_000, productId: 'pdt_demo_50', enabled: false },
]

function formatDollars(microdollars: number): string {
  return `$${(microdollars / 1_000_000).toFixed(2)}`
}

function getPercentage(used: number, budget: number): number {
  if (budget === 0) return 0
  return Math.min(100, Math.round((used / budget) * 100))
}

export function UsageBadge({ token, refreshTrigger, onTokenReceived }: Props) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [showTopup, setShowTopup] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingTier, setProcessingTier] = useState<string | null>(null)

  // Check for payment_id in URL on mount (returning from payment)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentId = urlParams.get('payment_id')

    if (paymentId) {
      console.log('[Payment] Found payment_id in URL:', paymentId)
      // Remove from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('payment_id')
      window.history.replaceState({}, '', newUrl.toString())
      // Verify and get token
      verifyAndGetToken(paymentId)
    }
  }, [])

  const verifyAndGetToken = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`${PAYMENT_API_URL}/checkout/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (response.ok && data.token && onTokenReceived) {
        console.log('[Payment] Token received!')
        onTokenReceived(data.token)
        setShowTopup(false)
      }
    } catch (err) {
      console.error('[Payment] Verification error:', err)
    } finally {
      setIsProcessing(false)
      setProcessingTier(null)
    }
  }

  const handleTopup = async (tier: typeof PRICING_TIERS[0]) => {
    setIsProcessing(true)
    setProcessingTier(tier.label)

    try {
      // Build return URL - DodoPayments will append payment_id automatically
      const returnUrl = `${window.location.origin}${window.location.pathname}`

      // Create checkout session
      const response = await fetch(`${PAYMENT_API_URL}/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: tier.productId,
          returnUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to checkout
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('[Payment] Checkout error:', err)
      setIsProcessing(false)
      setProcessingTier(null)
    }
  }

  const fetchUsage = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch(`${CHUCKY_API_URL}/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setUsage(await response.json())
      }
    } catch {
      // Silently fail - badge is non-critical
    }
  }, [token])

  useEffect(() => {
    fetchUsage()
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchUsage()
    }
  }, [refreshTrigger, fetchUsage])

  if (!usage) return null

  const percentage = getPercentage(usage.ai.used, usage.ai.budget)
  const isLow = percentage > 75
  const isCritical = percentage > 90
  const isExhausted = usage.ai.remaining <= 0

  return (
    <>
      <button
        onClick={() => setShowTopup(true)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
          isExhausted
            ? 'bg-red-500/30 text-red-100 hover:bg-red-500/40 animate-pulse'
            : isCritical
            ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
            : isLow
            ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30'
            : 'bg-white/10 text-white/80 hover:bg-white/20'
        }`}
        title={isExhausted ? 'Credits exhausted - click to recharge' : 'View credits & top up'}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{isExhausted ? 'Recharge' : formatDollars(usage.ai.remaining)}</span>
        {/* Mini progress bar */}
        {!isExhausted && (
          <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isCritical ? 'bg-red-400' : isLow ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${100 - percentage}%` }}
            />
          </div>
        )}
      </button>

      {/* Top-up Modal */}
      {showTopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowTopup(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-eu-blue to-eu-blue-dark p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {isExhausted ? 'Recharge Credits' : 'AI Credits'}
                </h2>
                <button onClick={() => setShowTopup(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {isExhausted && (
                <p className="text-sm text-white/80 mt-1">Your credits have run out. Top up to continue using the AI assistant.</p>
              )}
            </div>

            <div className="p-4">
              {/* Current Usage */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-semibold ${isExhausted ? 'text-red-600' : ''}`}>
                    {formatDollars(usage.ai.remaining)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isExhausted ? 'bg-red-500' : isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.max(0, 100 - percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Used: {formatDollars(usage.ai.used)}</span>
                  <span>Total: {formatDollars(usage.ai.budget)}</span>
                </div>
              </div>

              {/* Top-up Options */}
              <div className="space-y-2">
                {PRICING_TIERS.map((tier) => (
                  <button
                    key={tier.label}
                    onClick={() => tier.enabled && handleTopup(tier)}
                    disabled={isProcessing || !tier.enabled}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      !tier.enabled ? 'bg-gray-50' : tier.popular ? 'border-eu-blue bg-eu-blue/5 hover:shadow' : 'border-gray-200 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {processingTier === tier.label ? (
                        <svg className="w-4 h-4 animate-spin text-eu-blue" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <span className={`font-medium ${tier.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{tier.label}</span>
                      )}
                      {tier.popular && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${tier.enabled ? 'bg-eu-blue text-white' : 'bg-gray-300 text-gray-500'}`}>Best</span>
                      )}
                      {!tier.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded">Coming soon</span>
                      )}
                    </div>
                    <span className={`font-semibold ${tier.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{tier.price}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                Secure payment powered by DodoPayments
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
