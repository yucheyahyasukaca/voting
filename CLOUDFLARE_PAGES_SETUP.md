# Cloudflare Pages Setup Instructions

## ⚠️ PENTING: Update Konfigurasi di Cloudflare Pages Dashboard

Berdasarkan error yang terjadi, ada 2 hal yang perlu diperbaiki di Cloudflare Pages Dashboard:

### 1. Build Command

**SALAH (saat ini):**
```
npm run build
```

**BENAR (harus diubah menjadi):**
```
npm run build:cloudflare
```

**Alasan:** `build:cloudflare` akan menjalankan `next build` kemudian `@cloudflare/next-on-pages` untuk mempersiapkan output yang kompatibel dengan Cloudflare Pages.

### 2. Deploy Command

**SALAH (saat ini):**
```
npx wrangler deploy
```

**BENAR (pilih salah satu):**

**Opsi 1 (Recommended):** HAPUS/KOSONGKAN deploy command
- Cloudflare Pages akan otomatis deploy setelah build selesai
- Tidak perlu deploy command manual

**Opsi 2:** Jika memang perlu deploy command, gunakan:
```
npx wrangler pages deploy .vercel/output/static --project-name=voting-app
```

**PENTING:** 
- Gunakan `wrangler pages deploy` (dengan "pages")
- BUKAN `wrangler deploy` (tanpa "pages")
- `wrangler deploy` adalah untuk Cloudflare Workers, bukan Pages

### 3. Build Output Directory

Pastikan Build Output Directory di-set ke:
```
.vercel/output/static
```

## Langkah-langkah di Cloudflare Pages Dashboard

1. Buka project di Cloudflare Pages Dashboard
2. Klik **Settings** > **Builds & deployments**
3. Update **Build command** menjadi: `npm run build:cloudflare`
4. Update **Build output directory** menjadi: `.vercel/output/static`
5. **HAPUS** atau **KOSONGKAN** Deploy command (atau ubah menjadi `npx wrangler pages deploy .vercel/output/static --project-name=voting-app`)
6. Klik **Save**

## Environment Variables

Pastikan environment variables berikut sudah di-set di **Settings** > **Environment variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Setelah Update

Setelah mengupdate konfigurasi:
1. Klik **Retry deployment** pada deployment yang gagal
2. Atau buat deployment baru dengan push commit baru

## Troubleshooting

### Error: "An internal error prevented the form from submitting"
**Solusi langkah demi langkah:**

1. **Coba hapus Deploy command terlebih dahulu:**
   - Kosongkan field "Deploy command"
   - Simpan hanya dengan Build command dan Output directory
   - Cloudflare Pages akan otomatis deploy setelah build

2. **Jika masih error, coba update satu field per satu:**
   - Update Build command dulu, simpan
   - Kemudian update Output directory, simpan
   - Terakhir update Deploy command (jika diperlukan)

3. **Cek format command:**
   - Pastikan tidak ada karakter khusus yang tidak valid
   - Pastikan tidak ada trailing spaces
   - Coba copy-paste command langsung dari dokumentasi

4. **Refresh browser dan coba lagi:**
   - Clear browser cache
   - Logout dan login kembali ke Cloudflare
   - Coba di browser/incognito mode yang berbeda

5. **Alternatif: Gunakan Cloudflare Dashboard API atau CLI:**
   - Jika UI terus error, bisa gunakan Wrangler CLI untuk update konfigurasi

### Error: "It looks like you've run a Workers-specific command in a Pages project"
- **Penyebab:** Deploy command menggunakan `wrangler deploy` bukan `wrangler pages deploy`
- **Solusi:** Hapus deploy command atau ubah menjadi `npx wrangler pages deploy .vercel/output/static --project-name=voting-app`

### Error: "Missing entry-point"
- **Penyebab:** Build command tidak menggunakan `build:cloudflare` atau output directory salah
- **Solusi:** Pastikan build command adalah `npm run build:cloudflare` dan output directory adalah `.vercel/output/static`

### Build berhasil tapi tidak ada output di `.vercel/output/static`
- **Penyebab:** `@cloudflare/next-on-pages` mungkin gagal
- **Solusi:** Cek build logs untuk error dari `@cloudflare/next-on-pages`

