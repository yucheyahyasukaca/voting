# 🔧 Perbaiki Error "relation already exists"

Error ini muncul karena tabel sudah pernah dibuat sebelumnya. Kita perlu menggunakan schema yang "safe" yang tidak akan error jika tabel sudah ada.

## ✅ Solusi

### LANGKAH 1: Gunakan File Schema Baru

File `fix_schema.sql` sudah dibuat yang menggunakan `IF NOT EXISTS` untuk semua tabel dan `DROP POLICY IF EXISTS` untuk policies.

### LANGKAH 2: Jalankan Schema Baru di Supabase

1. **Buka Supabase Dashboard**
   - https://app.supabase.com
   - Pilih project: `hhwcmobnvosaombczeje`

2. **Buka SQL Editor**
   - Klik "SQL Editor" di sidebar
   - Klik "New query"

3. **Jalankan File Baru**
   - Buka file `fix_schema.sql` di project Anda
   - Copy seluruh isi file
   - Paste ke SQL Editor di Supabase
   - Klik "Run"

4. **Verifikasi**
   - Klik "Table Editor" di sidebar
   - Pastikan semua tabel ada: `elections`, `candidates`, `categories`, `votes`, `voting_sessions`, `users`
   - Klik salah satu tabel → Tab "Policies" → Pastikan ada policies yang aktif

### LANGKAH 3: Refresh Browser

- Tekan `Ctrl+Shift+R` untuk hard refresh
- Error 404/406 seharusnya hilang!

---

## 🔍 Alternatif: Cek Tabel yang Ada

Jika ingin cek tabel apa saja yang sudah ada:

1. Di SQL Editor, jalankan query ini:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Ini akan menampilkan semua tabel yang sudah ada.

---

## ✅ Checklist

- [ ] Sudah buka file `fix_schema.sql`
- [ ] Sudah copy seluruh isi file
- [ ] Sudah paste ke SQL Editor di Supabase
- [ ] Sudah klik "Run" dan tidak ada error
- [ ] Sudah verifikasi semua tabel ada di Table Editor
- [ ] Sudah cek policies aktif di setiap tabel
- [ ] Sudah refresh browser (hard refresh)
- [ ] Tidak ada lagi error 404/406

---

File `fix_schema.sql` menggunakan `IF NOT EXISTS` sehingga tidak akan error jika tabel sudah ada!

