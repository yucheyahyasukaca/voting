# 🔧 Perbaiki Error "new row violates row-level security policy" saat Upload

Error ini muncul karena **Storage RLS policies** belum disetup dengan benar untuk bucket "elections".

## ✅ Solusi Cepat

### LANGKAH 1: Jalankan Script Fix Storage RLS

1. Buka Supabase Dashboard → SQL Editor → New query
2. Copy seluruh isi file **`fix_storage_rls.sql`**
3. Paste ke SQL Editor
4. Klik **"Run"**

Script ini akan:
- ✅ Membuat bucket "elections" jika belum ada
- ✅ Enable RLS pada storage.objects
- ✅ Drop semua policies lama yang mungkin conflict
- ✅ Membuat policies baru yang benar untuk upload

### LANGKAH 2: Verifikasi Bucket

1. Di Supabase Dashboard, klik **"Storage"** di sidebar
2. Pastikan bucket **"elections"** sudah ada
3. Jika belum ada, bucket akan dibuat otomatis saat menjalankan script

### LANGKAH 3: Verifikasi Policies

**Cara 1: Via Dashboard**
1. Di Storage → Klik bucket **"elections"**
2. Klik tab **"Policies"**
3. Pastikan ada 4 policies:
   - ✅ "Public read elections" (SELECT)
   - ✅ "Allow upload elections" (INSERT) - **INI PENTING!**
   - ✅ "Allow update elections" (UPDATE)
   - ✅ "Allow delete elections" (DELETE)
4. Pastikan semua policies **AKTIF**

**Cara 2: Via SQL**
Jalankan query ini di SQL Editor:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%elections%';
```

Seharusnya menampilkan 4 policies.

### LANGKAH 4: Test Upload

1. **Refresh browser** (Ctrl+Shift+R)
2. Buka form tambah kandidat
3. Klik tombol **"Upload Foto"**
4. Pilih gambar
5. Seharusnya upload berhasil!

---

## 🔍 Troubleshooting

### Masih Error Setelah Fix?

**1. Cek Apakah Bucket "elections" Sudah Dibuat**
```sql
SELECT * FROM storage.buckets WHERE id = 'elections';
```
Harusnya mengembalikan 1 row.

**2. Cek Apakah Policies Sudah Dibuat**
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%elections%'
ORDER BY cmd;
```

Harusnya ada 4 policies:
- SELECT: `Public read elections`
- INSERT: `Allow upload elections` ← **INI YANG PENTING!**
- UPDATE: `Allow update elections`
- DELETE: `Allow delete elections`

**3. Test Manual Upload via SQL**
```sql
-- Cek apakah bisa insert ke storage.objects
-- (Query ini hanya untuk test, tidak akan upload file real)
SELECT bucket_id 
FROM storage.objects 
WHERE bucket_id = 'elections' 
LIMIT 1;
```

**4. Cek RLS Status**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

`rowsecurity` harus `true` (RLS enabled).

### Error: "bucket not found"

Jika error ini muncul saat upload:
1. Pastikan bucket "elections" sudah dibuat
2. Jalankan script `fix_storage_rls.sql` untuk membuat bucket
3. Atau buat bucket manual via Dashboard → Storage → New bucket

### Error: "policy violation"

Jika masih ada policy violation:
1. Pastikan policy INSERT sudah dibuat: `Allow upload elections`
2. Pastikan policy aktif (bukan disabled)
3. Pastikan `WITH CHECK` clause ada: `(bucket_id = 'elections')`

---

## ✅ Checklist

- [ ] Script `fix_storage_rls.sql` sudah dijalankan
- [ ] Tidak ada error saat menjalankan script
- [ ] Bucket "elections" sudah ada di Storage
- [ ] Bucket "elections" bersifat **public**
- [ ] Policy "Allow upload elections" (INSERT) sudah ada dan AKTIF
- [ ] Policy "Public read elections" (SELECT) sudah ada dan AKTIF
- [ ] Browser sudah di-refresh (hard refresh)
- [ ] Test upload foto berhasil

---

## 📝 File-file Penting

1. **`fix_storage_rls.sql`** - Script untuk fix Storage RLS (disarankan)
2. **`setup_storage_bucket.sql`** - Script setup bucket lengkap
3. **`SETUP_STORAGE.md`** - Panduan setup Storage lengkap

---

## 🆘 Butuh Bantuan?

Jika masih error setelah semua langkah:
1. Screenshot error di browser console
2. Screenshot policies di Storage → elections → Policies tab
3. Copy output dari query verifikasi policies

