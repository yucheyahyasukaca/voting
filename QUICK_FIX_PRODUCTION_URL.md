# SOLUSI: Fix QR Code URL Production

## ✅ Masalah Selesai

Link QR code sekarang **otomatis menyesuaikan dengan domain** yang sedang digunakan, baik di localhost maupun production.

## 📝 Perubahan Yang Dilakukan

### 1. File Baru
- ✅ `lib/app-url.ts` - Utility untuk mendapatkan URL aplikasi secara dinamis

### 2. File yang Dimodifikasi
- ✅ `app/admin/elections/[id]/page.tsx` - Update generate QR code
- ✅ `app/voter/results/page.tsx` - Update display QR code

### 3. Dokumentasi
- ✅ `FIX_PRODUCTION_URL.md` - Penjelasan lengkap tentang perubahan

## 🚀 Cara Deploy ke Production

### Option 1: Deploy Langsung (Recommended)
Tidak perlu setting environment variable, akan auto-detect domain:

```bash
# Commit changes
git add .
git commit -m "Fix: Auto-detect domain untuk QR code URL"
git push origin main

# Deploy akan otomatis detect domain production
```

### Option 2: Set Manual (Optional)
Jika ingin override domain tertentu:

**Cloudflare Pages:**
```bash
# Di Cloudflare Pages dashboard
Settings > Environment Variables > Add Variable

Name: NEXT_PUBLIC_APP_URL
Value: https://your-production-domain.com
```

**Vercel:**
```bash
# Di Vercel dashboard
Settings > Environment Variables > Add

Name: NEXT_PUBLIC_APP_URL
Value: https://your-production-domain.com
```

## 🧪 Testing

### Test Development
```bash
npm run dev
# Buka: http://localhost:3000/admin
# Generate QR code
# ✅ URL harus: http://localhost:3000/voter?qrcode=...
```

### Test Production
```bash
# Setelah deploy
# Buka: https://your-domain.com/admin
# Generate QR code
# ✅ URL harus: https://your-domain.com/voter?qrcode=...
```

## ⚠️ Catatan Penting

1. **QR Code Lama**
   - QR code yang sudah di-generate sebelumnya masih menggunakan `localhost`
   - **Solusi:** Generate ulang QR code di production
   - Cara: Buka Admin Panel → Pilih Election → Generate QR Code baru

2. **Auto-Detection Priority**
   ```
   1. window.location.origin (client-side) → Paling prioritas
   2. NEXT_PUBLIC_APP_URL (env var)
   3. VERCEL_URL (Vercel auto)
   4. CF_PAGES_URL (Cloudflare auto)
   5. http://localhost:3000 (fallback)
   ```

3. **Tidak Perlu Action Manual**
   - Cloudflare Pages: ✅ Auto-detect
   - Vercel: ✅ Auto-detect
   - Custom Domain: ✅ Auto-detect dari browser

## 📊 Status

- [x] Fix URL detection logic
- [x] Update admin panel QR generation
- [x] Update voter results QR display
- [x] Testing di localhost
- [ ] Testing di production (perlu deploy)
- [ ] Generate ulang QR codes di production

## 🎯 Langkah Selanjutnya

1. **Deploy ke Production**
   ```bash
   git add .
   git commit -m "Fix: QR code URL production auto-detection"
   git push origin main
   ```

2. **Generate Ulang QR Code** (setelah deploy)
   - Login ke Admin Panel production
   - Buka election yang aktif
   - Delete QR code lama (jika ada)
   - Generate QR code baru
   - Download dan print QR code baru

3. **Test QR Code Baru**
   - Scan QR code dengan HP
   - Pastikan URL-nya menggunakan domain production
   - Test voting process

## ❓ Troubleshooting

### QR Code masih localhost setelah deploy
**Penyebab:** QR code lama yang sudah di-generate sebelumnya  
**Solusi:** Generate ulang QR code baru di production

### URL tidak sesuai harapan
**Solusi:** Set manual `NEXT_PUBLIC_APP_URL` di environment variables

### Preview deployment URL tidak sesuai
**Normal:** Preview deployment di Cloudflare/Vercel menggunakan URL temporary  
**Solusi:** Gunakan production URL atau set `NEXT_PUBLIC_APP_URL`

