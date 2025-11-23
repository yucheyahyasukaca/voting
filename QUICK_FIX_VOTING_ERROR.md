# ⚡ Quick Fix: Error Voting "duplicate key violates unique constraint"

Error masih muncul karena **constraint lama belum dihapus**. Script SQL perlu dijalankan dengan benar.

## 🚀 Solusi Cepat (2 menit)

### LANGKAH 1: Jalankan Script Fix Constraint

1. **Buka Supabase Dashboard → SQL Editor → New query**

2. **Copy seluruh isi file `fix_votes_constraint.sql`**
   - Script sudah diperbaiki untuk menghapus SEMUA constraint terkait
   - Termasuk constraint lama dan baru (jika ada)

3. **Paste dan Run**

4. **Verifikasi**
   - Pastikan tidak ada error saat menjalankan script
   - Jika ada error, cek error message

### LANGKAH 2: Verifikasi Constraint Sudah Benar

Jalankan query ini di SQL Editor:

```sql
-- Cek constraint votes table
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'votes'::regclass 
  AND contype = 'u'
  AND conname LIKE '%election_id%category_id%voter_token%'
ORDER BY conname;
```

**Seharusnya hanya ada 1 constraint:**
- ✅ `votes_election_id_category_id_voter_token_candidate_id_key`
  - Definition: `UNIQUE (election_id, category_id, voter_token, candidate_id)`

**Jika masih ada constraint lama:**
- ❌ `votes_election_id_category_id_voter_token_key` (TANPA candidate_id)
  - Ini harus dihapus!

### LANGKAH 3: Hapus Manual (Jika Script Gagal)

Jika script masih error, hapus manual:

```sql
-- Hapus constraint lama (jika masih ada)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_key;

-- Hapus constraint baru (jika perlu recreate)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_candidate_id_key;

-- Buat constraint baru yang benar
ALTER TABLE votes ADD CONSTRAINT votes_election_id_category_id_voter_token_candidate_id_key
UNIQUE(election_id, category_id, voter_token, candidate_id);
```

### LANGKAH 4: Test Voting

1. **Refresh browser** (Ctrl+Shift+R)
2. Pilih 2 kandidat
3. Klik "Konfirmasi Suara"
4. Seharusnya voting berhasil! ✅

---

## 🔍 Troubleshooting

### Error: "constraint does not exist"

**Artinya:** Constraint sudah dihapus, langsung ke langkah 3 (buat constraint baru)

### Error: "constraint already exists"

**Artinya:** Constraint baru sudah ada, tapi constraint lama juga masih ada. Hapus constraint lama saja:

```sql
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_election_id_category_id_voter_token_key;
```

### Masih Error Setelah Fix?

1. **Cek constraint yang ada:**
   ```sql
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'votes'::regclass AND contype = 'u';
   ```

2. **Pastikan hanya ada 1 constraint** dengan `candidate_id` di dalamnya

3. **Jika masih ada constraint lama**, hapus manual

---

## ✅ Checklist

- [ ] Script `fix_votes_constraint.sql` sudah dijalankan
- [ ] Tidak ada error saat menjalankan script
- [ ] Constraint lama sudah dihapus (verifikasi dengan query)
- [ ] Constraint baru sudah dibuat (verifikasi dengan query)
- [ ] Browser sudah di-refresh
- [ ] Test voting berhasil
- [ ] Tidak ada error "duplicate key" lagi

---

**Setelah constraint diperbaiki, voting seharusnya berfungsi dengan baik!**

