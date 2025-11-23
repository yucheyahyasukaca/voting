# Fix: Production URL untuk QR Code

## Masalah
Di production, QR code masih menggunakan URL `localhost:3000` sehingga tidak bisa diakses oleh pengguna.

Contoh URL yang salah:
```
http://localhost:3000/voter?qrcode=voting-d5a0ae6a-b710-4d4d-a355-42eaab576682-1763884647126-mkzqob-0
```

## Solusi Implementasi

### 1. File Utility Baru: `lib/app-url.ts`

Dibuat utility function untuk mendapatkan URL aplikasi secara dinamis:

```typescript
export function getAppUrl(): string {
  // Client side - gunakan window.location.origin (domain actual)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Server side - check environment variables dengan prioritas:
  // 1. NEXT_PUBLIC_APP_URL - URL yang diset manual
  // 2. VERCEL_URL - Auto-set oleh Vercel
  // 3. CF_PAGES_URL - Auto-set oleh Cloudflare Pages
  // 4. Fallback ke localhost untuk development
  
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

export function getVotingUrl(qrCode: string): string {
  const baseUrl = getAppUrl()
  return `${baseUrl}/voter?qrcode=${qrCode}`
}
```

### 2. File yang Diupdate

#### a. `app/admin/elections/[id]/page.tsx`
- Menambah import: `import { getVotingUrl } from '@/lib/app-url'`
- Mengganti hardcoded URL dengan: `getVotingUrl(qrCode)`

#### b. `app/voter/results/page.tsx`
- Menambah import: `import { getVotingUrl } from '@/lib/app-url'`
- Mengganti hardcoded URL dengan: `getVotingUrl(qrCode)`

## Cara Kerja

### Development (Localhost)
- `window.location.origin` = `http://localhost:3000`
- QR Code akan generate: `http://localhost:3000/voter?qrcode=...`

### Production (Cloudflare Pages / Vercel)
- `window.location.origin` = `https://your-domain.com`
- QR Code akan generate: `https://your-domain.com/voter?qrcode=...`

## Keuntungan Solusi Ini

1. ✅ **Otomatis menyesuaikan domain** - tidak perlu set manual untuk setiap environment
2. ✅ **Bekerja di Cloudflare Pages** - detect otomatis dari `CF_PAGES_URL`
3. ✅ **Bekerja di Vercel** - detect otomatis dari `VERCEL_URL`
4. ✅ **Fallback ke localhost** - untuk development lokal
5. ✅ **Support custom domain** - bisa set manual via `NEXT_PUBLIC_APP_URL`

## Testing

### 1. Test di Localhost
```bash
npm run dev
# Buka http://localhost:3000/admin
# Generate QR code
# URL harus: http://localhost:3000/voter?qrcode=...
```

### 2. Test di Production
```bash
# Deploy ke Cloudflare Pages / Vercel
# Buka https://your-domain.com/admin
# Generate QR code
# URL harus: https://your-domain.com/voter?qrcode=...
```

## Environment Variables (Optional)

Jika ingin override URL secara manual, tambahkan di `.env.local` (development) atau environment variables (production):

```bash
NEXT_PUBLIC_APP_URL=https://custom-domain.com
```

## Notes

- ⚠️ **TIDAK PERLU set environment variable** untuk Cloudflare Pages/Vercel, akan auto-detect
- ✅ QR code yang sudah digenerate sebelumnya dengan `localhost` perlu digenerate ulang
- ✅ Solusi ini bekerja untuk semua deployment platform (Cloudflare, Vercel, Railway, dll)

