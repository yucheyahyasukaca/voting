# 🚨 SOLUSI LANGSUNG: Error "Project not found [code: 8000007]"

## ⚡ SOLUSI CEPAT (Pilih Salah Satu)

### ✅ OPSI 1: HAPUS Deploy Command (PALING RECOMMENDED)

**Ini adalah solusi TERBAIK dan PALING SIMPEL:**

1. Buka: https://dash.cloudflare.com
2. Masuk ke: **Workers & Pages** → **Pages**
3. Klik project Anda (atau buat project baru jika belum ada)
4. Klik: **Settings** → **Builds & deployments**
5. **HAPUS/KOSONGKAN** field "Deploy command" (biarkan kosong)
6. Pastikan:
   - Build command: `npm run build:cloudflare`
   - Build output directory: `.vercel/output/static`
7. Klik **Save**

**Mengapa ini bekerja?**
- Cloudflare Pages **otomatis deploy** setelah build selesai
- Deploy command manual TIDAK diperlukan untuk automatic deployment
- Ini cara standar dan paling reliable

---

### ✅ OPSI 2: Tambahkan Flag `--create` di Deploy Command

**Jika Anda tetap ingin menggunakan Deploy command:**

1. Buka: https://dash.cloudflare.com
2. Masuk ke: **Workers & Pages** → **Pages**
3. Klik project Anda → **Settings** → **Builds & deployments**
4. Update **Deploy command** menjadi:
   ```
   npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create
   ```
   **PENTING:** Tambahkan `--create` di akhir!
5. Klik **Save**

**Mengapa ini bekerja?**
- Flag `--create` akan membuat project "voting-app" otomatis jika belum ada
- Jika project sudah ada, akan menggunakan project yang sudah ada

---

### ✅ OPSI 3: Buat Project Terlebih Dahulu

**Jika Anda ingin membuat project manual:**

1. Buka: https://dash.cloudflare.com
2. Masuk ke: **Workers & Pages** → **Pages**
3. Klik **"Create a project"**
4. Pilih **"Connect to Git"**
5. Pilih repository Anda (GitHub/GitLab/Bitbucket)
6. Isi form:
   - **Project name:** `voting-app` (harus sama persis!)
   - **Production branch:** `main` atau `master`
   - **Framework preset:** None
   - **Build command:** `npm run build:cloudflare`
   - **Build output directory:** `.vercel/output/static`
   - **Deploy command:** (KOSONGKAN - biarkan kosong)
7. Klik **"Save and Deploy"**

**Setelah project dibuat:**
- Deployment selanjutnya akan otomatis menggunakan project "voting-app"
- Tidak perlu Deploy command lagi

---

## 🔍 VERIFIKASI

Setelah mengikuti salah satu solusi di atas:

1. ✅ Pastikan konfigurasi sudah benar:
   - Build command: `npm run build:cloudflare`
   - Build output directory: `.vercel/output/static`
   - Deploy command: (KOSONG atau dengan `--create`)

2. ✅ Retry deployment:
   - Klik **"Retry deployment"** pada deployment yang gagal
   - Atau push commit baru untuk trigger deployment baru

3. ✅ Cek build logs:
   - Pastikan build berhasil (tidak ada error)
   - Pastikan deployment berhasil

---

## 📋 CHECKLIST

Sebelum retry deployment, pastikan:

- [ ] **Deploy command sudah diupdate** (Opsi 1: kosong, Opsi 2: dengan `--create`, Opsi 3: project sudah dibuat)
- [ ] **Build command:** `npm run build:cloudflare`
- [ ] **Build output directory:** `.vercel/output/static`
- [ ] **Project sudah dibuat** (jika pilih Opsi 3)
- [ ] **Environment variables sudah di-set** (NEXT_PUBLIC_SUPABASE_URL, dll)
- [ ] **Klik Save** di Cloudflare Pages Dashboard

---

## ❓ MASIH ERROR?

Jika setelah mengikuti langkah di atas masih error:

1. **Cek apakah project sudah ada:**
   - Buka Cloudflare Pages Dashboard
   - Lihat daftar project di **Workers & Pages** → **Pages**
   - Cari project dengan nama "voting-app"

2. **Jika project tidak ada:**
   - Gunakan Opsi 1 (hapus deploy command) ATAU
   - Gunakan Opsi 2 (tambah `--create`) ATAU
   - Gunakan Opsi 3 (buat project manual)

3. **Jika project sudah ada tapi nama berbeda:**
   - Update Deploy command dengan nama project yang benar
   - Contoh: `--project-name=nama-project-yang-benar`

---

## 💡 REKOMENDASI FINAL

**Gunakan OPSI 1 (Hapus Deploy Command)** karena:
- ✅ Paling simpel dan reliable
- ✅ Tidak perlu manage project name
- ✅ Cloudflare Pages handle deployment otomatis
- ✅ Tidak akan error "Project not found"

