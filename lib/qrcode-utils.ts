/**
 * Normalize QR code value to ensure consistency
 * Removes whitespace and ensures consistent format
 */
export function normalizeQRCode(qrCode: string | null | undefined): string {
  if (!qrCode) return ''
  
  // Trim whitespace from both ends
  let normalized = qrCode.trim()
  
  // Remove any trailing/leading special characters that might cause issues
  normalized = normalized.replace(/^[\s\n\r\t]+|[\s\n\r\t]+$/g, '')
  
  return normalized
}

/**
 * Extract QR code from decoded text (from QR scanner)
 * Handles various formats: full URL, partial URL, or just the code
 */
export function extractQRCode(decodedText: string): string {
  if (!decodedText) return decodedText
  
  // Trim whitespace and normalize
  let normalized = decodedText.trim()
  
  let qrCode = normalized
  
  // Extract qrcode dari URL jika ada
  if (normalized.includes('qrcode=')) {
    try {
      // Coba parse sebagai URL lengkap
      const url = new URL(normalized)
      const extracted = url.searchParams.get('qrcode')
      if (extracted) {
        qrCode = normalizeQRCode(extracted)
      } else {
        // Fallback: extract menggunakan regex
        const match = normalized.match(/qrcode=([^&?#\s]+)/)
        qrCode = match ? normalizeQRCode(match[1]) : normalized
      }
    } catch {
      // Jika bukan URL valid, coba extract dengan regex
      const match = normalized.match(/qrcode=([^&?#\s]+)/)
      qrCode = match ? normalizeQRCode(match[1]) : normalized
    }
  } else if (normalized.includes('/voter')) {
    // Extract dari path yang mengandung /voter
    const match = normalized.match(/qrcode=([^&?#\s]+)/)
    qrCode = match ? normalizeQRCode(match[1]) : normalized
  } else {
    // Jika tidak ada pattern URL, gunakan langsung (tapi normalize)
    qrCode = normalizeQRCode(normalized)
  }
  
  // Final normalization
  qrCode = normalizeQRCode(qrCode)
  
  // Log untuk debugging (hanya di development)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log('[QR Extract] Original:', decodedText)
    console.log('[QR Extract] Extracted:', qrCode)
  }
  
  return qrCode
}

