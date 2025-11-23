# 🗄️ Setup Database Supabase

Error 404 dan 406 biasanya berarti **tabel di database belum dibuat**. Ikuti panduan ini untuk membuat semua tabel.

## ✅ Langkah-langkah Setup Database

### LANGKAH 1: Buka Supabase Dashboard

1. Buka https://app.supabase.com
2. Login ke akun Anda
3. Pilih project Anda: `hhwcmobnvosaombczeje`

### LANGKAH 2: Buka SQL Editor

1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik tombol **"New query"** di pojok kanan atas

### LANGKAH 3: Jalankan Schema SQL

1. Di SQL Editor, Anda akan melihat area text editor
2. **Copy seluruh isi** file `supabase/schema.sql` di project Anda
   - File ada di: `D:\My Project\voting\supabase\schema.sql`
3. **Paste** ke SQL Editor di Supabase
4. Klik tombol **"Run"** (atau tekan `Ctrl+Enter` / `Cmd+Enter`)

### LANGKAH 4: Verifikasi Tabel

Setelah menjalankan schema, verifikasi bahwa semua tabel sudah dibuat:

1. Di sidebar kiri, klik **"Table Editor"**
2. Anda seharusnya melihat tabel-tabel berikut:
   - ✅ `elections`
   - ✅ `candidates`
   - ✅ `categories`
   - ✅ `votes`
   - ✅ `voting_sessions`
   - ✅ `users`

Jika semua tabel sudah ada, database setup sudah selesai! 🎉

---

## 🔍 Troubleshooting

### Error saat menjalankan SQL?

**Error: "extension 'uuid-ossp' already exists"**
- ✅ Ini normal, lanjutkan saja. Extension sudah ada sebelumnya.

**Error: "relation already exists"**
- ✅ Tabel sudah ada sebelumnya. Ini tidak masalah.
- Jika ingin reset, hapus tabel yang ada dulu.

**Error lain?**
- Copy pesan error lengkap
- Cek apakah ada syntax error di SQL
- Pastikan tidak ada karakter tersembunyi saat copy-paste

### Masih Error 404/406 setelah setup database?

1. **Refresh Browser**
   - Tekan `Ctrl+Shift+R` (atau `Cmd+Shift+R` di Mac) untuk hard refresh
   - Atau tutup dan buka browser lagi

2. **Cek RLS Policies**
   - Di Supabase Dashboard → Table Editor
   - Pilih tabel (misalnya `categories`)
   - Klik tab "Policies"
   - Pastikan ada policy yang mengizinkan SELECT

3. **Test Query Manual**
   - Di SQL Editor, coba query:
   ```sql
   SELECT * FROM categories LIMIT 1;
   ```
   - Jika berhasil, tabel sudah ada dan bisa diakses

4. **Cek Environment Variables**
   - Pastikan server sudah di-restart setelah membuat `.env.local`
   - Test di: http://localhost:3000/test-env

---

## ✅ Checklist

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Sudah login ke Supabase Dashboard
- [ ] Sudah membuka SQL Editor
- [ ] Sudah copy seluruh isi file `supabase/schema.sql`
- [ ] Sudah paste ke SQL Editor di Supabase
- [ ] Sudah klik "Run" dan tidak ada error
- [ ] Sudah verifikasi di Table Editor bahwa semua tabel ada
- [ ] Sudah refresh browser (hard refresh: Ctrl+Shift+R)
- [ ] Sudah restart development server
- [ ] Tidak ada lagi error 404 di browser console

---

## 📚 File Schema

Schema SQL lengkap ada di file:
- **Lokasi**: `D:\My Project\voting\supabase\schema.sql`
- **Isi**: Semua CREATE TABLE statements, indexes, triggers, dan RLS policies

Jika perlu melihat isi lengkap schema, buka file tersebut di editor.

---

## 🆘 Butuh Bantuan?

Jika masih error setelah setup database:
1. Screenshot error di SQL Editor
2. Screenshot error di browser console
3. Cek apakah semua tabel sudah ada di Table Editor

