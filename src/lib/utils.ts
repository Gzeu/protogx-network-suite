import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatEGLD(value: string | number, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return (num / 1e18).toFixed(decimals)
}

export function truncateText(text: string, length = 100): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function formatNumber(num: number, compact = false): string {
  if (compact && num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (compact && num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function generateGradient(seed: string): string {
  // Simple hash function
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Generate colors from hash
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 120) % 360
  
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%) 0%, hsl(${hue2}, 70%, 60%) 100%)`
}

export function isValidAddress(address: string): boolean {
  // MultiversX address validation
  const addressRegex = /^erd[a-z0-9]{59}$/
  return addressRegex.test(address)
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let lastCall = 0
  return ((...args: Parameters<T>) => {
    const now = new Date().getTime()
    if (now - lastCall < delay) return
    lastCall = now
    return func(...args)
  }) as T
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      textArea.remove()
      return Promise.resolve(true)
    } catch (err) {
      textArea.remove()
      return Promise.resolve(false)
    }
  }
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

export function generateRandomId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}