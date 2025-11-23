# Fix: Error Policy Already Exists

## 🔴 Error yang Muncul

```
Error: Failed to run sql query: ERROR: 42710: policy "Voting sessions can be deleted by anyone" for table "voting_sessions" already exists
```

## ✅ Solusi

Policy `"Voting sessions can be deleted by anyone"` sudah ada di database. Anda punya 2 pilihan:

### **Pilihan 1: Run Updated SQL (Recommended)**

File `add_delete_policies.sql` sudah diupdate dengan `DROP IF EXISTS` untuk menghindari konflik.

**Langkah:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste query dari file **`add_delete_policies.sql`** (yang sudah diupdate)
3. Run query

Query yang diupdate:
```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Elections can be deleted by anyone" ON elections;
DROP POLICY IF EXISTS "Voting sessions can be deleted by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Votes can be deleted by anyone" ON votes;

-- Create DELETE policies
CREATE POLICY "Elections can be deleted by anyone" ON elections
    FOR DELETE USING (true);

CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions
    FOR DELETE USING (true);

CREATE POLICY "Votes can be deleted by anyone" ON votes
    FOR DELETE USING (true);
```

### **Pilihan 2: Run Hanya Policy yang Kurang**

Karena policy voting_sessions sudah ada, run hanya untuk Elections dan Votes:

**Langkah:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste query dari file **`add_missing_delete_policies.sql`**
3. Run query

Query minimal:
```sql
-- Tambahkan policy untuk Elections
DROP POLICY IF EXISTS "Elections can be deleted by anyone" ON elections;
CREATE POLICY "Elections can be deleted by anyone" ON elections
    FOR DELETE USING (true);

-- Tambahkan policy untuk Votes
DROP POLICY IF EXISTS "Votes can be deleted by anyone" ON votes;
CREATE POLICY "Votes can be deleted by anyone" ON votes
    FOR DELETE USING (true);
```

## 🧪 Verifikasi

Setelah run salah satu query di atas:

1. Tidak ada error lagi ✅
2. Pesan: "Success. No rows returned" atau "Success"
3. Test delete pemilihan di: http://localhost:3000/admin

## 🎯 Test Delete Feature

1. Buka **http://localhost:3000/admin**
2. Klik button **Hapus** pada pemilihan
3. Modal konfirmasi muncul
4. Klik **Ya, Hapus**
5. ✅ Pemilihan terhapus beserta semua data terkait

## 📋 Files

- `add_delete_policies.sql` - SQL query lengkap (sudah diupdate dengan DROP IF EXISTS)
- `add_missing_delete_policies.sql` - SQL query hanya untuk policy yang kurang

## ❓ Troubleshooting

### Masih error setelah run query?

**Cek policy yang sudah ada:**
```sql
-- Cek policy untuk elections
SELECT * FROM pg_policies WHERE tablename = 'elections';

-- Cek policy untuk voting_sessions
SELECT * FROM pg_policies WHERE tablename = 'voting_sessions';

-- Cek policy untuk votes
SELECT * FROM pg_policies WHERE tablename = 'votes';
```

### Ingin hapus dan buat ulang policy?

```sql
-- Hapus semua DELETE policies
DROP POLICY IF EXISTS "Elections can be deleted by anyone" ON elections;
DROP POLICY IF EXISTS "Voting sessions can be deleted by anyone" ON voting_sessions;
DROP POLICY IF EXISTS "Votes can be deleted by anyone" ON votes;

-- Buat ulang
CREATE POLICY "Elections can be deleted by anyone" ON elections
    FOR DELETE USING (true);

CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions
    FOR DELETE USING (true);

CREATE POLICY "Votes can be deleted by anyone" ON votes
    FOR DELETE USING (true);
```

---

**Setelah selesai setup, fitur delete sudah siap digunakan!** 🚀

