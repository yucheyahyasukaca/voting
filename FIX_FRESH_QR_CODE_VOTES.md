# 🔧 Fix: QR Code Baru Sudah Ada Voting Terpilih

## Masalah

Ketika membuat QR code baru yang fresh:
- ✅ QR code baru berhasil dibuat
- ❌ Ketika di-upload, sudah ada voting terpilih (tidak seharusnya!)
- ❌ Voter melihat pilihan yang sudah ada padahal QR code baru

Ini menyebabkan QR code baru seolah-olah sudah pernah digunakan untuk vote.

---

## Akar Masalah

Masalahnya adalah query existing votes menggunakan `voter_token` yang berasal dari URL parameter yang sudah dinormalize, bukan dari nilai exact di database. Ini bisa menyebabkan:

1. **Mismatch dengan Database**: QR code di URL mungkin sudah di-normalize, tapi di database menggunakan nilai exact
2. **Query Existing Votes Salah**: Query menggunakan `voter_token` yang tidak exact match dengan `qr_code` di database
3. **False Positive**: Query menemukan votes dari QR code lain yang secara tidak sengaja match setelah normalize

---

## Solusi

### 1. Ambil QR Code Exact dari Database

**Sebelum:**
```typescript
// Hanya ambil election_id
const { data: session } = await supabase
  .from('voting_sessions')
  .select('election_id')
  .eq('qr_code', qrCode!)
  .single()

// Gunakan qrCode dari URL (yang sudah dinormalize)
const voterToken = normalizeQRCode(qrCode!)
```

**Sesudah:**
```typescript
// Ambil election_id DAN qr_code dari database
const { data: session } = await supabase
  .from('voting_sessions')
  .select('election_id, qr_code')  // ← Ambil qr_code juga
  .eq('qr_code', qrCode!)
  .single()

// Gunakan qr_code EXACT dari database
const voterToken = session.qr_code  // ← Exact match dengan database
```

### 2. Konsistensi di Semua Query

Gunakan `qr_code` dari database sebagai `voter_token` di:
- ✅ Check existing votes
- ✅ Insert new votes
- ✅ Delete existing votes

---

## File yang Diupdate

### `app/voter/vote/page.tsx`

**Perubahan:**
1. **loadElectionData()**: 
   - Ambil `qr_code` dari voting_sessions query
   - Gunakan `session.qr_code` sebagai `voter_token` (exact dari DB)

2. **handleVote()**:
   - Ambil `qr_code` dari voting_sessions query
   - Gunakan `session.qr_code` sebagai `voter_token` (exact dari DB)

---

## Alur Baru

```
1. User upload/scan QR code
   ↓
2. Extract & normalize QR code dari input
   ↓
3. Query voting_sessions dengan qrCode (yang sudah dinormalize)
   ↓
4. Ambil qr_code EXACT dari database (session.qr_code)
   ↓
5. Gunakan session.qr_code sebagai voter_token
   ↓
6. Query existing votes dengan voter_token = session.qr_code (EXACT match)
   ↓
7. Jika QR code baru → Tidak ada votes → Bisa vote
   ↓
8. Jika QR code sudah pernah vote → Ada votes → Tampilkan pilihan sebelumnya
```

---

## Manfaat

✅ **Konsistensi**: Selalu menggunakan nilai exact dari database  
✅ **Akurasi**: Tidak ada false positive dari normalize  
✅ **Keamanan**: QR code baru tidak akan match dengan votes lama  
✅ **Reliabilitas**: Query existing votes selalu exact match  

---

## Testing

### Test Case 1: QR Code Baru
1. Generate QR code baru dari admin
2. Upload QR code
3. ✅ Seharusnya: Tidak ada voting terpilih (kosong)

### Test Case 2: QR Code yang Sudah Vote
1. Upload QR code yang sudah pernah digunakan untuk vote
2. ✅ Seharusnya: Menampilkan pilihan yang sudah dipilih sebelumnya

### Test Case 3: Query Exact Match
1. Check di database: `SELECT qr_code FROM voting_sessions WHERE ...`
2. Check votes: `SELECT voter_token FROM votes WHERE voter_token = ...`
3. ✅ Seharusnya: `voter_token` di votes EXACT sama dengan `qr_code` di voting_sessions

---

## Verifikasi di Database

Untuk memastikan fix bekerja:

```sql
-- 1. Cek voting session dengan QR code baru
SELECT qr_code, election_id, created_at
FROM voting_sessions
WHERE qr_code LIKE 'voting-%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Cek apakah ada votes dengan voter_token yang sama
SELECT voter_token, category_id, candidate_id, created_at
FROM votes
WHERE voter_token = 'voting-xxx-xxx-xxx'  -- Ganti dengan qr_code dari step 1
ORDER BY created_at DESC;

-- 3. Untuk QR code baru:
-- ✅ Seharusnya: Tidak ada rows di votes table
-- ❌ Jika ada rows: Masih ada masalah
```

---

## Kesimpulan

✅ **Fix ini memastikan**:
- QR code baru tidak akan menunjukkan voting terpilih
- Query existing votes selalu menggunakan nilai exact dari database
- Tidak ada false positive dari normalize atau mismatch
- Konsistensi antara voting_sessions dan votes table

**Sekarang QR code baru yang fresh akan selalu kosong (tidak ada voting terpilih)!** 🎉

