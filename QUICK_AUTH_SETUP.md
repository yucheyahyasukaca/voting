# 🔐 Quick Setup: Admin Authentication

## ✅ Sudah Selesai Dibuat

1. ✅ Login page di `/login`
2. ✅ Logout button di admin dashboard
3. ✅ Middleware protect admin routes
4. ✅ Authentication helpers
5. ✅ SQL untuk update RLS policies

## 🚀 3 Langkah Setup

### Langkah 1: Buat Admin User di Supabase

1. Buka: https://supabase.com/dashboard
2. Pilih project Anda
3. **Authentication** → **Users** → **Add User**
4. Isi:
   - Email: `admin@example.com` (sesuaikan)
   - Password: `*******` (password kuat)
   - Auto Confirm User: ✅ **Yes**
5. Klik **Create User**

### Langkah 2: Update RLS Policies

1. Buka: **SQL Editor** → **New Query**
2. Copy-paste dari file: **`update_rls_for_auth.sql`**
3. Klik **Run**
4. ✅ Success!

### Langkah 3: Test Login

1. Buka: http://localhost:3000/login
2. Login dengan email & password dari Langkah 1
3. ✅ Redirect ke admin dashboard
4. ✅ Ada button **Logout** (merah) di header

## 🎯 Hasil

### ✅ Yang Berhasil:
- Admin routes protected (harus login)
- Login page cantik dengan gradient biru-ungu
- Logout button di dashboard
- Session persistent (tidak perlu login berulang)
- Voters tetap bisa vote tanpa login

### 🔒 Security:
- Hanya authenticated users bisa CRUD elections/candidates/categories
- Voters bisa view & vote tanpa login
- Session tersimpan dengan aman
- Auto-redirect jika tidak authenticated

## 📋 Testing Checklist

- [ ] Buat admin user di Supabase Auth
- [ ] Run SQL query untuk RLS
- [ ] Test login di http://localhost:3000/login
- [ ] Test akses admin dashboard
- [ ] Test create election (butuh auth)
- [ ] Test logout
- [ ] Test voter page (tanpa auth)

## 🐛 Common Issues

### "Invalid login credentials"
→ Check email/password atau buat user baru di Supabase Auth

### Redirect loop ke /login
→ Clear browser localStorage dan login ulang

### Error saat create election
→ Run SQL query `update_rls_for_auth.sql` untuk update RLS

## 📁 File SQL

**`update_rls_for_auth.sql`** - Copy-paste ke Supabase SQL Editor

Mengubah policies dari "anyone" menjadi "authenticated only" untuk:
- Elections (INSERT/UPDATE/DELETE)
- Candidates (INSERT/UPDATE/DELETE)
- Categories (INSERT/UPDATE/DELETE)
- Voting Sessions (INSERT/UPDATE/DELETE)
- Votes (DELETE)

**Public tetap bisa:**
- SELECT semua data (untuk voters)
- INSERT votes (untuk voting)

---

**🎉 Setelah 3 langkah di atas, authentication sudah siap digunakan!**

