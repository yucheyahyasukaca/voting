# Setup Supabase untuk Aplikasi Voting

Panduan lengkap untuk menghubungkan aplikasi voting dengan Supabase.

## 📋 Daftar Isi

1. [Membuat Project Supabase](#1-membuat-project-supabase)
2. [Setup Database Schema](#2-setup-database-schema)
3. [Mendapatkan API Credentials](#3-mendapatkan-api-credentials)
4. [Setup Environment Variables](#4-setup-environment-variables)
5. [Testing Koneksi](#5-testing-koneksi)

---

## 1. Membuat Project Supabase

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Login atau buat akun baru
3. Klik **"New Project"**
4. Isi form:
   - **Name**: Nama project Anda (contoh: `voting-app`)
   - **Database Password**: Buat password yang kuat (simpan password ini!)
   - **Region**: Pilih region terdekat dengan pengguna (contoh: `Southeast Asia (Singapore)`)
   - **Pricing Plan**: Pilih plan yang sesuai (Free tier cukup untuk development)
5. Klik **"Create new project"** dan tunggu hingga project siap (biasanya 1-2 menit)

---

## 2. Setup Database Schema

1. Di Supabase Dashboard, klik **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**
3. Buka file `supabase/schema.sql` di project Anda
4. Copy seluruh isi file tersebut
5. Paste ke SQL Editor di Supabase
6. Klik **"Run"** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)
7. Tunggu hingga selesai - Anda akan melihat pesan sukses jika berhasil

### ✅ Verifikasi Schema

Setelah menjalankan schema, pastikan semua tabel sudah dibuat:
- `elections` - Data pemilihan
- `candidates` - Data kandidat
- `categories` - Data kategori pemilihan
- `votes` - Data suara yang diberikan
- `voting_sessions` - Sesi voting dengan QR code
- `users` - Data pengguna (opsional)

Anda dapat melihat tabel-tabel ini di **"Table Editor"** di sidebar.

---

## 3. Mendapatkan API Credentials

1. Di Supabase Dashboard, klik **"Settings"** (icon gear) di sidebar kiri
2. Klik **"API"** di menu Settings
3. Di halaman API Settings, Anda akan melihat:

   ### Project URL
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   Copy URL ini - ini adalah `NEXT_PUBLIC_SUPABASE_URL`

   ### Project API keys
   Ada beberapa keys yang tersedia:
   
   - **`anon` `public`** key → Ini adalah `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Key ini aman untuk digunakan di client-side (browser)
     - Terbatas oleh Row Level Security (RLS) policies
   
   - **`service_role` `secret`** key → Ini adalah `SUPABASE_SERVICE_ROLE_KEY`
     - **PENTING**: Key ini sangat sensitif!
     - Jangan pernah di-share atau commit ke git
     - Hanya digunakan di server-side
     - Melewati semua RLS policies

---

## 4. Setup Environment Variables

### Cara 1: Membuat file .env.local secara manual

1. Di root folder project Anda, buat file baru dengan nama `.env.local`
2. Copy template berikut dan isi dengan credentials Anda:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Ganti nilai-nilai placeholder dengan credentials dari Supabase Dashboard

### Cara 2: Menggunakan terminal (PowerShell / CMD)

Di terminal, jalankan perintah berikut (ganti dengan credentials Anda):

```powershell
# Windows PowerShell
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here" >> .env.local
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local
```

### ⚠️ Penting!

- File `.env.local` sudah di-ignore oleh git (tidak akan ter-commit)
- Jangan pernah commit file `.env.local` ke repository
- Jangan share credentials ke siapa pun

---

## 5. Testing Koneksi

1. **Restart Development Server**
   ```bash
   # Stop server yang sedang berjalan (Ctrl+C)
   npm run dev
   ```

2. **Cek Console Browser**
   - Buka aplikasi di `http://localhost:3000`
   - Buka Browser DevTools (F12)
   - Lihat Console tab
   - Jika ada error tentang Supabase credentials, cek file `.env.local`

3. **Test Aplikasi**
   - Buka `/admin` untuk admin panel
   - Coba buat pemilihan baru
   - Cek di Supabase Dashboard → Table Editor → `elections` untuk melihat data baru

4. **Troubleshooting**

   **Error: "Missing env.NEXT_PUBLIC_SUPABASE_URL"**
   - Pastikan file `.env.local` ada di root folder
   - Pastikan nama variabel benar (huruf besar/kecil penting!)
   - Restart development server

   **Error: "Invalid API key"**
   - Cek kembali credentials di Supabase Dashboard
   - Pastikan tidak ada spasi di awal/akhir key
   - Pastikan meng-copy seluruh key (biasanya sangat panjang)

   **Error: "new row violates row-level security policy"**
   - Pastikan sudah menjalankan schema SQL (termasuk RLS policies)
   - Cek di Supabase Dashboard → Authentication → Policies

---

## ✅ Checklist Setup

- [ ] Project Supabase sudah dibuat
- [ ] Database schema sudah dijalankan di SQL Editor
- [ ] Semua tabel sudah muncul di Table Editor
- [ ] API credentials sudah di-copy dari Settings → API
- [ ] File `.env.local` sudah dibuat dan diisi dengan credentials
- [ ] Development server sudah direstart
- [ ] Tidak ada error di browser console
- [ ] Bisa membuat pemilihan baru di admin panel
- [ ] Data muncul di Supabase Table Editor

---

## 📚 Langkah Selanjutnya

Setelah setup berhasil:

1. **Testing Fitur**
   - Buat pemilihan baru di admin panel
   - Tambah kandidat dan kategori
   - Generate QR code
   - Test voting flow

2. **Storage (Opsional)**
   Jika ingin upload gambar untuk banner/photo kandidat:
   - Di Supabase Dashboard, buka **Storage**
   - Buat bucket baru (contoh: `elections`)
   - Set policy untuk public read access
   - Update code untuk upload ke Supabase Storage

3. **Authentication (Opsional)**
   Untuk menambahkan autentikasi admin:
   - Setup Supabase Auth
   - Update RLS policies untuk membatasi akses
   - Tambah login page untuk admin

4. **Deployment**
   - Setup environment variables di hosting platform (Vercel, Netlify, dll)
   - Pastikan semua environment variables sudah di-set
   - Deploy aplikasi

---

## 🆘 Butuh Bantuan?

- Dokumentasi Supabase: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- File dokumentasi project:
  - `CARA_SETUP_ENV.txt` - Setup environment variables
  - `TROUBLESHOOTING.md` - Masalah umum dan solusi

---

**Selamat! Aplikasi voting Anda sekarang terhubung dengan Supabase! 🎉**

