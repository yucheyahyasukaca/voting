# 🔧 Perbaiki Error Voting "duplicate key violates unique constraint"

Error ini terjadi karena constraint di database yang terlalu ketat mencegah voter memberikan 2 votes untuk 2 kandidat berbeda dalam 1 kategori.

## ✅ Solusi

### LANGKAH 1: Fix Database Constraint

1. **Buka Supabase Dashboard → SQL Editor → New query**

2. **Copy seluruh isi file `fix_votes_constraint.sql`**

3. **Paste dan Run**

Script ini akan:
- ✅ Drop constraint lama yang salah: `UNIQUE(election_id, category_id, voter_token)`
- ✅ Buat constraint baru yang benar: `UNIQUE(election_id, category_id, voter_token, candidate_id)`

### LANGKAH 2: Verifikasi

Setelah script berhasil, verifikasi constraint:

```sql
-- Cek constraint votes table
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'votes'::regclass 
  AND contype = 'u';
```

Seharusnya ada constraint: `votes_election_id_category_id_voter_token_candidate_id_key`

### LANGKAH 3: Test Voting

1. **Refresh browser** (Ctrl+Shift+R)
2. Pilih 2 kandidat
3. Klik "Konfirmasi Suara"
4. Seharusnya voting berhasil! ✅

---

## 🔍 Penjelasan Masalah

### Sebelum (SALAH):
```sql
UNIQUE(election_id, category_id, voter_token)
```
**Masalah:** Mencegah voter memberikan >1 vote per kategori
- ❌ Tidak bisa vote untuk 2 kandidat berbeda
- ❌ Error "duplicate key" saat insert vote kedua

### Sesudah (BENAR):
```sql
UNIQUE(election_id, category_id, voter_token, candidate_id)
```
**Solusi:** Membolehkan voter memberikan 2 votes (untuk 2 kandidat berbeda)
- ✅ Boleh vote untuk candidate1 dan candidate2
- ✅ Tetap mencegah vote 2 kali untuk candidate yang sama

---

## 📝 Contoh

**Sebelum (Constraint Lama):**
```sql
-- ❌ Tidak bisa: voter1 vote untuk candidate1 DAN candidate2
INSERT INTO votes (election_id, category_id, voter_token, candidate_id)
VALUES 
  ('e1', 'c1', 'voter1', 'candidate1'),  -- ✅ Berhasil
  ('e1', 'c1', 'voter1', 'candidate2');  -- ❌ Error: duplicate key
```

**Sesudah (Constraint Baru):**
```sql
-- ✅ Bisa: voter1 vote untuk candidate1 DAN candidate2
INSERT INTO votes (election_id, category_id, voter_token, candidate_id)
VALUES 
  ('e1', 'c1', 'voter1', 'candidate1'),  -- ✅ Berhasil
  ('e1', 'c1', 'voter1', 'candidate2');  -- ✅ Berhasil (candidate_id berbeda)

-- ❌ Tetap tidak bisa vote 2 kali untuk candidate yang sama
INSERT INTO votes (election_id, category_id, voter_token, candidate_id)
VALUES ('e1', 'c1', 'voter1', 'candidate1');  -- ❌ Error: duplicate key
```

---

## ✅ Checklist

- [ ] Script `fix_votes_constraint.sql` sudah dijalankan
- [ ] Tidak ada error saat menjalankan script
- [ ] Constraint baru sudah dibuat
- [ ] Browser sudah di-refresh
- [ ] Test voting berhasil
- [ ] Tidak ada error "duplicate key" lagi

---

**Setelah menjalankan script, voting seharusnya berfungsi dengan baik!**

