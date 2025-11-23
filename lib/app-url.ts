/**
 * Get the base URL of the application
 * Works in both client and server side
 * In production, uses the actual domain instead of localhost
 */
export function getAppUrl(): string {
  // Client side - use window.location.origin for dynamic domain detection
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server side - check environment variables
  // Priority:
  // 1. NEXT_PUBLIC_APP_URL - explicitly set URL
  // 2. VERCEL_URL - Vercel deployment URL
  // 3. CF_PAGES_URL - Cloudflare Pages deployment URL
  // 4. Fallback to localhost for development
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  if (process.env.CF_PAGES_URL) {
    return process.env.CF_PAGES_URL
  }
  
  return 'http://localhost:3000'
}

/**
 * Generate voting URL with QR code
 */
export function getVotingUrl(qrCode: string): string {
  const baseUrl = getAppUrl()
  return `${baseUrl}/voter?qrcode=${qrCode}`
}

