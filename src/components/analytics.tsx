'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Analytics configuration
const ANALYTICS_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// Google Analytics
function gtag(...args: any[]) {
  // @ts-ignore
  window.dataLayer = window.dataLayer || []
  // @ts-ignore
  window.dataLayer.push(arguments)
}

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize Google Analytics
    if (ANALYTICS_ID && typeof window !== 'undefined') {
      gtag('js', new Date())
      gtag('config', ANALYTICS_ID, {
        page_path: pathname,
        custom_map: {
          custom_parameter_1: 'protogx_game_type',
          custom_parameter_2: 'protogx_user_level'
        }
      })
    }
  }, [])

  useEffect(() => {
    // Track page views
    if (ANALYTICS_ID && typeof window !== 'undefined') {
      const url = pathname + (searchParams?.toString() ? '?' + searchParams.toString() : '')
      gtag('config', ANALYTICS_ID, {
        page_path: url,
      })
    }
  }, [pathname, searchParams])

  // Initialize Sentry (client-side)
  useEffect(() => {
    if (SENTRY_DSN && typeof window !== 'undefined') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: process.env.NODE_ENV,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          beforeSend(event) {
            // Filter out development errors
            if (process.env.NODE_ENV === 'development') {
              return null
            }
            return event
          },
        })
      })
    }
  }, [])

  return (
    <>
      {/* Google Analytics */}
      {ANALYTICS_ID && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ANALYTICS_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
    </>
  )
}

// Custom event tracking functions
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && ANALYTICS_ID) {
    gtag('event', eventName, {
      custom_parameter_1: 'protogx_gaming',
      ...parameters,
    })
  }
}

export const trackGameStart = (gameType: string) => {
  trackEvent('game_start', {
    game_type: gameType,
    custom_parameter_1: gameType,
  })
}

export const trackGameEnd = (gameType: string, score: number, duration: number) => {
  trackEvent('game_end', {
    game_type: gameType,
    score,
    duration_seconds: duration,
  })
}

export const trackWalletConnect = (walletType: string) => {
  trackEvent('wallet_connect', {
    wallet_type: walletType,
  })
}

export const trackNFTClaim = (nftType: string, gameType: string) => {
  trackEvent('nft_claim', {
    nft_type: nftType,
    game_type: gameType,
  })
}