# 🔧 Fix: QR Code Tidak Terhapus Setelah Delete

Masalahnya adalah **RLS policy untuk DELETE pada voting_sessions table belum ada**, sehingga delete QR code gagal secara silent (tidak ada error, tapi data tidak terhapus).

## ✅ Solusi

### LANGKAH 1: Tambahkan DELETE Policy

1. **Buka Supabase Dashboard → SQL Editor → New query**

2. **Copy seluruh isi file `add_voting_sessions_delete_policy.sql`**

3. **Paste dan Run**

Script ini akan menambahkan policy DELETE pada voting_sessions table.

### LANGKAH 2: Verifikasi Policy Sudah Dibuat

Jalankan query ini untuk cek:

```sql
-- Cek DELETE policy pada voting_sessions table
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'voting_sessions'
  AND cmd = 'DELETE';
```

**Seharusnya menampilkan:**
- ✅ `policyname: "Voting sessions can be deleted by anyone"`
- ✅ `cmd: DELETE`

### LANGKAH 3: Test Delete QR Code

1. **Refresh browser** (Ctrl+Shift+R)
2. Klik tombol "Hapus" pada salah satu QR code
3. Konfirmasi delete
4. Seharusnya **QR code terhapus dari UI!** ✅

---

## 🔍 Penjelasan Masalah

### Sebelum (Tanpa DELETE Policy):
```sql
-- Voting sessions: Public read and write access, tapi tidak ada DELETE policy
CREATE POLICY "Voting sessions are viewable by everyone" ON voting_sessions FOR SELECT USING (true);
CREATE POLICY "Voting sessions can be inserted by anyone" ON voting_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Voting sessions can be updated by anyone" ON voting_sessions FOR UPDATE USING (true);
-- ❌ TIDAK ADA policy DELETE
```

**Masalah:**
- ❌ Delete QR code gagal (diblokir RLS)
- ✅ Notifikasi "berhasil dihapus" muncul (karena tidak ada error)
- ❌ QR code tetap ada di UI (karena delete tidak berhasil)
- **Hasil: QR code tidak terhapus meskipun ada notifikasi berhasil**

### Sesudah (Dengan DELETE Policy):
```sql
CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions FOR DELETE USING (true);
```

**Solusi:**
- ✅ Delete QR code berhasil
- ✅ QR code terhapus dari database
- ✅ UI terupdate setelah reload
- **Hasil: QR code benar-benar terhapus!** ✅

---

## ✅ Checklist

- [ ] Script `add_voting_sessions_delete_policy.sql` sudah dijalankan
- [ ] Policy DELETE sudah ada (verifikasi dengan query)
- [ ] Refresh browser
- [ ] Test delete QR code individual
- [ ] Test delete semua QR code
- [ ] QR code benar-benar terhapus dari UI

