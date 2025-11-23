# Cloudflare Pages Setup Instructions

## 🚨 ERROR: "Project not found [code: 8000007]"

Jika Anda mendapatkan error ini saat deployment:
```
✘ [ERROR] A request to the Cloudflare API failed.
  Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

**Solusi CEPAT:**
1. Buka Cloudflare Pages Dashboard
2. Klik **Settings** > **Builds & deployments**
3. **HAPUS/KOSONGKAN** field "Deploy command" (ini yang TERPENTING!)
4. Pastikan Build command: `npm run build:cloudflare`
5. Pastikan Build output directory: `.vercel/output/static`
6. Klik **Save**

**Mengapa?** Cloudflare Pages sudah otomatis deploy setelah build. Deploy command manual TIDAK diperlukan dan bisa menyebabkan error jika project name tidak sesuai.

---

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

**⚠️ PENTING: Deploy command biasanya TIDAK diperlukan!**

**SALAH (bisa menyebabkan error):**
```
npx wrangler pages deploy .vercel/output/static --project-name=voting
npx wrangler deploy
```

**BENAR (pilih salah satu):**

**Opsi 1 (STRONGLY RECOMMENDED):** HAPUS/KOSONGKAN deploy command
- Cloudflare Pages akan **otomatis deploy** setelah build selesai
- Tidak perlu deploy command manual
- Ini adalah cara standar menggunakan Cloudflare Pages
- Menghindari error "Project not found" atau "Authentication error"

**Opsi 2:** Jika memang perlu deploy command (misalnya untuk manual deployment via CLI), pastikan:
```
npx wrangler pages deploy .vercel/output/static --project-name=NAMA_PROJECT_YANG_BENAR
```

**PENTING:** 
- Gunakan `wrangler pages deploy` (dengan "pages")
- BUKAN `wrangler deploy` (tanpa "pages")
- `wrangler deploy` adalah untuk Cloudflare Workers, bukan Pages
- Pastikan project name sesuai dengan project yang ada di Cloudflare Pages dashboard
- Atau gunakan `--create` flag jika ingin auto-create project: `--project-name=voting-app --create`

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

### Error: "Authentication error [code: 10000]" saat deploy
- **Penyebab:** API token tidak memiliki permission untuk deploy ke Cloudflare Pages, atau deploy command tidak diperlukan
- **Solusi:** **HAPUS deploy command** - Cloudflare Pages akan otomatis deploy setelah build selesai. Deploy command manual hanya diperlukan jika menggunakan Wrangler CLI secara manual, bukan untuk automatic deployment di Cloudflare Pages.

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

### Error: "Project not found. The specified project name does not match any of your existing projects. [code: 8000007]"
- **Penyebab:** Deploy command mencoba deploy ke project yang tidak ada. Project name di deploy command tidak sesuai dengan project yang ada di Cloudflare Pages dashboard.
- **Solusi (Pilih salah satu):**
  
  **Opsi 1 (Recommended - TERBAIK):** HAPUS/KOSONGKAN deploy command
  - Cloudflare Pages sudah otomatis deploy setelah build selesai
  - Deploy command manual TIDAK diperlukan untuk automatic deployment
  - Langkah: Di Cloudflare Pages Dashboard > Settings > Builds & deployments > HAPUS/KOSONGKAN field "Deploy command"
  
  **Opsi 2:** Buat project di Cloudflare Pages dashboard terlebih dahulu
  - Buka Cloudflare Pages Dashboard
  - Klik "Create a project"
  - Pilih "Connect to Git"
  - Pilih repository Anda
  - Set Build command: `npm run build:cloudflare`
  - Set Build output directory: `.vercel/output/static`
  - KOSONGKAN Deploy command
  - Klik "Save and Deploy"
  
  **Opsi 3:** Jika harus menggunakan deploy command, pastikan project name sesuai:
  - Hapus deploy command yang ada
  - Tambahkan deploy command baru: `npx wrangler pages deploy .vercel/output/static --project-name=NAMA_PROJECT_YANG_ADA`
  - Ganti `NAMA_PROJECT_YANG_ADA` dengan nama project yang sebenarnya ada di Cloudflare Pages dashboard Anda
  - ATAU gunakan flag `--create` untuk auto-create: `npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create`
  
  **PENTING:** Opsi 1 adalah yang PALING RECOMMENDED karena Cloudflare Pages sudah otomatis handle deployment. Deploy command hanya diperlukan jika Anda deploy manual via CLI.

### Build berhasil tapi tidak ada output di `.vercel/output/static`
- **Penyebab:** `@cloudflare/next-on-pages` mungkin gagal
- **Solusi:** Cek build logs untuk error dari `@cloudflare/next-on-pages`

