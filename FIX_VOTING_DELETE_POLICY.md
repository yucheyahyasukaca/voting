# 🔧 Fix: Voting Hanya Berhasil 1 Kandidat (Delete Policy Missing)

Masalahnya adalah **RLS policy untuk DELETE pada votes table belum ada**, sehingga delete votes lama gagal dan hanya 1 kandidat yang berhasil di-vote.

## ✅ Solusi

### LANGKAH 1: Tambahkan DELETE Policy

1. **Buka Supabase Dashboard → SQL Editor → New query**

2. **Copy seluruh isi file `add_votes_delete_policy.sql`**

3. **Paste dan Run**

Script ini akan menambahkan policy DELETE pada votes table.

### LANGKAH 2: Verifikasi Policy Sudah Dibuat

Jalankan query ini untuk cek:

```sql
-- Cek DELETE policy pada votes table
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'votes'
  AND cmd = 'DELETE';
```

**Seharusnya menampilkan:**
- ✅ `policyname: "Votes can be deleted by voter"`
- ✅ `cmd: DELETE`

### LANGKAH 3: Test Voting

1. **Refresh browser** (Ctrl+Shift+R)
2. Pilih 2 kandidat
3. Klik "Konfirmasi Suara"
4. Seharusnya **kedua kandidat berhasil di-vote!** ✅

---

## 🔍 Penjelasan Masalah

### Sebelum (Tanpa DELETE Policy):
```sql
-- Votes: Public read for results, anyone can insert (voting), no updates/deletes
CREATE POLICY "Votes are viewable by everyone" ON votes FOR SELECT USING (true);
CREATE POLICY "Votes can be inserted by anyone" ON votes FOR INSERT WITH CHECK (true);
-- ❌ TIDAK ADA policy DELETE
```

**Masalah:**
- ❌ Delete votes lama gagal (diblokir RLS)
- ✅ Insert vote pertama berhasil
- ❌ Insert vote kedua gagal (constraint violation - votes lama masih ada)
- **Hasil: Hanya 1 kandidat yang berhasil di-vote**

### Sesudah (Dengan DELETE Policy):
```sql
CREATE POLICY "Votes can be deleted by voter" ON votes FOR DELETE USING (true);
```

**Solusi:**
- ✅ Delete votes lama berhasil
- ✅ Insert 2 votes baru berhasil
- **Hasil: Kedua kandidat berhasil di-vote!**

---

## ✅ Checklist

- [ ] Script `add_votes_delete_policy.sql` sudah dijalankan
- [ ] Tidak ada error saat menjalankan script
- [ ] DELETE policy sudah dibuat (verifikasi dengan query)
- [ ] Browser sudah di-refresh
- [ ] Test voting dengan 2 kandidat
- [ ] Kedua kandidat berhasil di-vote

---

**Setelah menambahkan DELETE policy, voting untuk 2 kandidat seharusnya berfungsi dengan baik!**

