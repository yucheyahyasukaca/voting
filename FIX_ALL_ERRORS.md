# 🔧 Perbaiki Semua Error - Comprehensive Fix

Error 406 pada votes table biasanya karena:
1. ✅ **RLS policy untuk SELECT tidak ada atau tidak aktif**
2. ✅ **Tabel votes tidak ada atau struktur salah**
3. ✅ **Headers Accept tidak sesuai**

## ✅ Solusi Lengkap

### LANGKAH 1: Jalankan Script Comprehensive Fix

Script `comprehensive_fix.sql` akan:
- ✅ Membuat semua tabel jika belum ada
- ✅ Memperbaiki struktur tabel votes (drop & recreate)
- ✅ Membuat semua indexes
- ✅ Membuat semua triggers
- ✅ Enable RLS pada semua tabel
- ✅ **Recreate semua RLS policies** (termasuk yang penting untuk votes!)
- ✅ Memastikan kolom `allow_view_results` ada

**Cara:**
1. Buka Supabase Dashboard → SQL Editor → New query
2. Copy **seluruh isi** file `comprehensive_fix.sql`
3. Paste ke SQL Editor
4. Klik **"Run"**

**⚠️ PERINGATAN:**
- Script ini akan **DROP tabel votes** (menghapus semua data votes!)
- Jika sudah ada data votes penting, backup dulu!

### LANGKAH 2: Verifikasi

Setelah script berhasil, verifikasi:

**1. Cek Tabel Votes**
```sql
SELECT COUNT(*) FROM votes;
```
Seharusnya tidak error (bahkan jika hasilnya 0).

**2. Cek RLS Policies untuk Votes**
- Di Supabase Dashboard → Table Editor → Pilih tabel `votes`
- Klik tab **"Policies"**
- Pastikan ada 2 policies:
  - ✅ "Votes are viewable by everyone" (SELECT) - **AKTIF**
  - ✅ "Votes can be inserted by anyone" (INSERT) - **AKTIF**

**3. Test Query Manual**
```sql
-- Test SELECT (seharusnya tidak error 406)
SELECT * FROM votes LIMIT 1;

-- Test dengan filter (seperti di aplikasi)
SELECT candidate_id 
FROM votes 
WHERE election_id = (SELECT id FROM elections LIMIT 1);
```

### LANGKAH 3: Refresh Browser

1. **Hard refresh browser**: `Ctrl+Shift+R`
2. **Clear browser cache** (jika perlu):
   - Chrome/Edge: `Ctrl+Shift+Delete` → Clear cached images and files
3. **Restart Development Server**:
   ```powershell
   # Stop server (Ctrl+C)
   npm run dev
   ```

### LANGKAH 4: Test Aplikasi

1. Buka: http://localhost:3000/admin
2. Pilih pemilihan
3. Cek apakah error 406 sudah hilang di console
4. Test toggle "Izinkan Melihat Hasil Live"
5. Test melihat hasil voting

---

## 🔍 Troubleshooting

### Masih Error 406 Setelah Fix?

**1. Cek Browser Console (F12)**
- Lihat error message lengkap
- Cek URL request (apakah ke `/rest/v1/votes`?)
- Cek status code (406 atau yang lain?)

**2. Cek RLS Policies di Supabase**
- Dashboard → Table Editor → `votes` → Tab "Policies"
- Pastikan ada policy untuk **SELECT** dan statusnya **AKTIF**
- Jika tidak aktif, klik toggle untuk mengaktifkan

**3. Test Query Langsung di SQL Editor**
```sql
-- Jika query ini error, berarti masalah di database
SELECT * FROM votes LIMIT 1;

-- Jika query ini berhasil tapi aplikasi error, berarti masalah di kode aplikasi
```

**4. Cek Headers**
- Error 406 bisa karena headers Accept tidak sesuai
- Pastikan Supabase client mengirim headers yang benar

**5. Cek Apakah Tabel Votes Benar-benar Ada**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'votes';
```
Harusnya mengembalikan 1 row.

---

## ✅ Checklist

Gunakan checklist ini untuk memastikan semua sudah benar:

- [ ] Script `comprehensive_fix.sql` sudah dijalankan
- [ ] Tidak ada error saat menjalankan script
- [ ] Tabel `votes` sudah ada (cek di Table Editor)
- [ ] RLS policy SELECT untuk votes sudah ada dan AKTIF
- [ ] RLS policy INSERT untuk votes sudah ada dan AKTIF
- [ ] Test query `SELECT * FROM votes` berhasil (tidak error)
- [ ] Browser sudah di-refresh (hard refresh)
- [ ] Development server sudah di-restart
- [ ] Tidak ada error 406 di browser console
- [ ] Toggle "Izinkan Melihat Hasil Live" bekerja
- [ ] Halaman hasil voting bisa dibuka

---

## 📝 File-file Penting

1. **`comprehensive_fix.sql`** - Script utama untuk memperbaiki semua masalah
2. **`fix_rls_policies.sql`** - Script alternatif jika hanya ingin fix RLS
3. **`fix_schema.sql`** - Script untuk fix schema (perlu hati-hati, akan drop votes table)

---

## 🆘 Butuh Bantuan?

Jika masih error setelah semua langkah:
1. Screenshot error di browser console
2. Screenshot error di Supabase SQL Editor (jika ada)
3. Cek apakah semua policies aktif di Table Editor

