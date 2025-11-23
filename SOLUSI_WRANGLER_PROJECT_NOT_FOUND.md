# 🔧 Solusi Alternatif: Mengatasi Error Wrangler "Project not found"

## 🎯 Masalah

Error yang terjadi:
```
✘ [ERROR] A request to the Cloudflare API failed.
  Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

## ✅ Solusi Alternatif (Tanpa Menghapus Deploy Command)

### **Solusi 1: Gunakan Flag `--create` (Auto-Create Project)**

Ini akan membuat project otomatis jika belum ada.

#### Langkah:

1. **Update Deploy Command di Cloudflare Pages Dashboard:**
   - Buka Cloudflare Pages Dashboard
   - Settings > Builds & deployments
   - Update **Deploy command** menjadi:
   ```
   npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create
   ```
   - Tambahkan flag `--create` di akhir

2. **Atau Update di `package.json`:**
   ```json
   {
     "scripts": {
       "deploy": "npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create"
     }
   }
   ```

**Keuntungan:**
- Project akan dibuat otomatis jika belum ada
- Tidak perlu membuat project manual di dashboard
- Tetap bisa menggunakan deploy command

---

### **Solusi 2: Buat Project Terlebih Dahulu di Cloudflare Pages**

#### Langkah:

1. **Buat Project di Cloudflare Pages:**
   - Buka https://dash.cloudflare.com
   - Workers & Pages > Pages
   - Klik **"Create a project"**
   - Pilih **"Connect to Git"**
   - Pilih repository Anda (GitHub/GitLab/Bitbucket)
   - Set nama project: **"voting-app"** (harus sama persis!)
   - Set Build command: `npm run build:cloudflare`
   - Set Build output directory: `.vercel/output/static`
   - **KOSONGKAN** Deploy command (biarkan kosong)
   - Klik **"Save and Deploy"**

2. **Setelah project dibuat, Update Deploy Command:**
   - Settings > Builds & deployments
   - Update Deploy command:
   ```
   npx wrangler pages deploy .vercel/output/static --project-name=voting-app
   ```
   - Pastikan project name sama persis dengan yang ada di dashboard

**Keuntungan:**
- Project sudah ada, tidak akan error "Project not found"
- Bisa setup environment variables sekaligus

---

### **Solusi 3: Cek Nama Project yang Ada, Lalu Sesuaikan**

#### Langkah:

1. **Cek Nama Project yang Ada:**
   - Buka Cloudflare Pages Dashboard
   - Lihat daftar project yang ada
   - Catat nama project yang benar

2. **Update Deploy Command dengan Nama yang Benar:**
   - Settings > Builds & deployments
   - Update Deploy command:
   ```
   npx wrangler pages deploy .vercel/output/static --project-name=NAMA_PROJECT_YANG_BENAR
   ```
   - Ganti `NAMA_PROJECT_YANG_BENAR` dengan nama project yang sebenarnya ada

3. **Atau Update `wrangler.toml`:**
   ```toml
   name = "NAMA_PROJECT_YANG_BENAR"
   ```
   - Dan gunakan deploy command tanpa `--project-name`:
   ```
   npx wrangler pages deploy .vercel/output/static
   ```
   - Wrangler akan menggunakan `name` dari `wrangler.toml`

**Catatan:** Untuk Cloudflare Pages, `name` di `wrangler.toml` tidak secara otomatis digunakan untuk `--project-name`, tapi bisa digunakan sebagai referensi.

---

### **Solusi 4: Gunakan Wrangler tanpa `--project-name` (Jika Project Sudah Ada)**

Jika project sudah dibuat melalui Git integration:

1. **Hapus `--project-name` dari Deploy Command:**
   ```
   npx wrangler pages deploy .vercel/output/static
   ```

2. **Wrangler akan mendeteksi project dari:**
   - Git repository yang terhubung
   - Atau bisa ditentukan secara interaktif

**Catatan:** Ini mungkin tidak bekerja di CI/CD environment karena tidak interaktif.

---

## 📝 Update `wrangler.toml` (Optional)

File `wrangler.toml` saat ini:
```toml
name = "voting-app"
compatibility_date = "2024-09-23"
pages_build_output_dir = ".vercel/output/static"
```

Ini sudah benar, tapi untuk Cloudflare Pages:
- `name` tidak otomatis digunakan untuk `--project-name`
- `pages_build_output_dir` sudah benar
- Tetap perlu specify `--project-name` di deploy command

---

## 🎯 Rekomendasi

### **Opsi Terbaik untuk Automatic Deployment:**

**Tetap gunakan tanpa Deploy Command:**
- Cloudflare Pages otomatis deploy setelah build
- Tidak perlu manage project name
- Lebih simpel dan reliable

### **Jika Harus Menggunakan Deploy Command:**

**Gunakan Solusi 1 (Flag `--create`):**
```
npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create
```

Ini akan:
- ✅ Membuat project otomatis jika belum ada
- ✅ Menggunakan project yang sudah ada jika sudah dibuat
- ✅ Tidak perlu setup manual di dashboard

---

## 🔍 Debug: Cek Status Project

Untuk cek apakah project sudah ada, jalankan (dari local):
```bash
npx wrangler pages project list
```

Ini akan menampilkan semua Pages project di akun Anda.

---

## 📋 Checklist Implementasi

Pilih salah satu solusi di atas, lalu:

- [ ] Update Deploy Command di Cloudflare Pages Dashboard
- [ ] Pastikan Build command: `npm run build:cloudflare`
- [ ] Pastikan Build output directory: `.vercel/output/static`
- [ ] Set Environment Variables (jika belum)
- [ ] Test deployment dengan retry atau push commit baru

