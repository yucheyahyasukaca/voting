# 🚨 Cara Mengatasi Error "Project not found [code: 8000007]"

## Error yang Terjadi

```
✘ [ERROR] A request to the Cloudflare API failed.
  Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

## ✅ Solusi: Hapus Deploy Command

### Langkah-langkah Detail:

1. **Buka Cloudflare Dashboard**
   - Kunjungi: https://dash.cloudflare.com
   - Login ke akun Cloudflare Anda

2. **Masuk ke Pages**
   - Klik **Workers & Pages** di sidebar kiri
   - Klik **Pages** di menu

3. **Buka Project Settings**
   - Klik pada nama project yang error (atau buat project baru jika belum ada)
   - Klik tab **Settings** di bagian atas

4. **Edit Builds & Deployments**
   - Scroll ke bawah, cari section **Builds & deployments**
   - Atau klik langsung: **Settings** > **Builds & deployments**

5. **HAPUS Deploy Command**
   - Cari field **"Deploy command"** atau **"Deploy command (optional)"**
   - **HAPUS/KOSONGKAN** field tersebut (biarkan kosong)
   - Ini adalah langkah TERPENTING!

6. **Pastikan Konfigurasi Benar**
   - **Build command:** `npm run build:cloudflare`
   - **Build output directory:** `.vercel/output/static`
   - **Deploy command:** (KOSONG - tidak perlu diisi)

7. **Simpan**
   - Klik tombol **Save** atau **Save and Deploy**

8. **Retry Deployment**
   - Klik **Retry deployment** pada deployment yang gagal
   - Atau tunggu deployment otomatis jika ada commit baru

## 🔍 Verifikasi

Setelah mengubah konfigurasi, pastikan:
- ✅ Build command: `npm run build:cloudflare`
- ✅ Build output directory: `.vercel/output/static`
- ✅ Deploy command: **KOSONG** (tidak ada isinya)

## ❓ Mengapa Harus Hapus Deploy Command?

1. **Cloudflare Pages sudah otomatis deploy** setelah build selesai
2. **Deploy command manual TIDAK diperlukan** untuk automatic deployment
3. **Deploy command bisa menyebabkan error** jika:
   - Project name tidak sesuai
   - Project belum dibuat
   - Ada masalah dengan API token/permission

## 🆘 Jika Masih Error

Jika setelah menghapus Deploy command masih ada error:

1. **Pastikan project sudah dibuat** di Cloudflare Pages
   - Jika belum ada, buat project baru terlebih dahulu
   - Pilih "Connect to Git" dan ikuti wizard

2. **Cek Build Logs**
   - Pastikan build berhasil (tidak ada error di build stage)
   - Cek apakah output directory benar-benar ada

3. **Pastikan Environment Variables sudah di-set**
   - Settings > Environment variables
   - Set variable untuk Production, Preview, dan Branch preview

4. **Coba Retry Deployment**
   - Klik "Retry deployment" pada deployment yang gagal

## 📝 Checklist

Sebelum deployment, pastikan:
- [ ] Deploy command sudah dihapus/dikosongkan
- [ ] Build command: `npm run build:cloudflare`
- [ ] Build output directory: `.vercel/output/static`
- [ ] Project sudah dibuat di Cloudflare Pages
- [ ] Environment variables sudah di-set
- [ ] Repository sudah terhubung dengan Cloudflare Pages

