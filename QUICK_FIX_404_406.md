# ⚡ Quick Fix: Error 404 & 406

Error ini berarti **database tables belum dibuat** di Supabase.

## 🚀 Solusi Cepat (5 menit)

### 1️⃣ Buka Supabase Dashboard
- https://app.supabase.com
- Login dan pilih project: `hhwcmobnvosaombczeje`

### 2️⃣ Buka SQL Editor
- Klik **"SQL Editor"** di sidebar kiri
- Klik **"New query"**

### 3️⃣ Jalankan Schema
1. Buka file: `D:\My Project\voting\supabase\schema.sql`
2. **Select All** (Ctrl+A) dan **Copy** (Ctrl+C)
3. **Paste** ke SQL Editor di Supabase
4. Klik **"Run"** (atau tekan `Ctrl+Enter`)

### 4️⃣ Verifikasi
- Klik **"Table Editor"** di sidebar
- Pastikan ada tabel: `elections`, `candidates`, `categories`, `votes`, `voting_sessions`

### 5️⃣ Refresh Browser
- Tekan `Ctrl+Shift+R` untuk hard refresh
- Error seharusnya hilang!

---

## ❓ Masih Error?

**Error 404** = Tabel belum ada → Jalankan schema SQL

**Error 406** = Masalah headers/RLS → Cek RLS policies sudah aktif

**Cara cek:**
1. Supabase Dashboard → Table Editor → Pilih tabel
2. Tab "Policies" → Pastikan ada policy yang aktif

---

Lihat `SETUP_DATABASE.md` untuk panduan lengkap.

