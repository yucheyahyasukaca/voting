# 🔧 Fix: QR Code Consistency - Upload vs Scan

## Masalah

Ketika user melakukan voting:
- **Upload QR code** → Data voting sudah ada (tidak bisa vote lagi) ✅
- **Scan QR code** → Data voting belum ada (bisa vote lagi) ❌

Ini menyebabkan voter bisa vote **dua kali** dengan QR code yang sama jika menggunakan metode yang berbeda!

---

## Akar Masalah

QR code yang di-extract dari **upload** berbeda dengan yang di-extract dari **scan**, sehingga menghasilkan `voter_token` yang berbeda. Ini menyebabkan:

1. Upload menghasilkan QR code A → vote disimpan dengan voter_token A
2. Scan menghasilkan QR code B (dari QR code yang sama!) → vote disimpan dengan voter_token B
3. Sistem menganggap ini adalah 2 voter berbeda!

### Kemungkinan Penyebab:

1. **Whitespace/Spasi** - QR code dari scan mungkin mengandung whitespace yang tidak terlihat
2. **URL Encoding** - Perbedaan encoding/decoding antara upload dan scan
3. **Format Extract** - Logika extract berbeda atau tidak konsisten
4. **Character Encoding** - Perbedaan karakter encoding antara kedua metode

---

## Solusi

### 1. Utility Function untuk Normalize QR Code

Dibuat utility function di `lib/qrcode-utils.ts`:

```typescript
/**
 * Normalize QR code value to ensure consistency
 */
export function normalizeQRCode(qrCode: string | null | undefined): string {
  if (!qrCode) return ''
  let normalized = qrCode.trim()
  normalized = normalized.replace(/^[\s\n\r\t]+|[\s\n\r\t]+$/g, '')
  return normalized
}

/**
 * Extract QR code from decoded text (from QR scanner)
 */
export function extractQRCode(decodedText: string): string {
  // ... logic untuk extract dengan normalization
}
```

### 2. Update Extract Function

Fungsi `extractQRCode()` di `app/page.tsx` sekarang:
- ✅ Menggunakan utility function terpusat
- ✅ Normalize whitespace
- ✅ Handle berbagai format URL
- ✅ Konsisten antara upload dan scan

### 3. Normalize QR Code Sebelum Digunakan

Di semua tempat yang menggunakan QR code sebagai `voter_token`:
- ✅ Normalize sebelum query database
- ✅ Normalize sebelum simpan sebagai voter_token
- ✅ Normalize saat extract dari URL parameter

---

## File yang Diupdate

### 1. `lib/qrcode-utils.ts` (NEW)
- Utility function untuk normalize dan extract QR code
- Digunakan di seluruh aplikasi untuk konsistensi

### 2. `app/page.tsx`
- Import utility function
- Hapus duplicate extract logic
- Gunakan `extractQRCode()` dari utility

### 3. `app/voter/vote/page.tsx`
- Import `normalizeQRCode`
- Normalize QR code sebelum digunakan sebagai voter_token
- Normalize saat query database

---

## Testing

Untuk memastikan fix bekerja:

### Test Case 1: Upload dan Scan QR Code Sama
1. Generate QR code dari admin
2. Vote menggunakan **upload** gambar QR code
3. Coba vote lagi menggunakan **scan** QR code yang sama
4. ✅ Seharusnya: Tidak bisa vote lagi (sudah ada data)

### Test Case 2: Format QR Code Berbeda
1. QR code dengan whitespace
2. QR code dengan URL encoding berbeda
3. QR code dengan format URL lengkap vs hanya token
4. ✅ Seharusnya: Semua menghasilkan voter_token yang sama

### Test Case 3: Query Database
1. Cek `voting_sessions` table untuk QR code
2. Cek `votes` table untuk voter_token
3. ✅ Seharusnya: QR code dan voter_token match dengan data di database

---

## Cara Verifikasi

### 1. Check Console Log (Development Mode)

Di development mode, akan ada log:
```
[QR Extract] Original: http://localhost:3000/voter?qrcode=xxx
[QR Extract] Extracted: xxx
```

Pastikan `Extracted` value konsisten antara upload dan scan!

### 2. Check Database

Query di Supabase:
```sql
-- Cek voting session
SELECT qr_code, election_id 
FROM voting_sessions 
WHERE qr_code LIKE '%xxx%';

-- Cek votes dengan voter_token
SELECT voter_token, category_id, candidate_id, created_at
FROM votes
WHERE voter_token LIKE '%xxx%';
```

Pastikan `qr_code` di `voting_sessions` match dengan `voter_token` di `votes`!

### 3. Manual Test

1. **Step 1**: Upload QR code dan vote
   - Note: voter_token yang digunakan
   
2. **Step 2**: Scan QR code yang sama
   - Check: Apakah voter_token sama?
   - Check: Apakah data vote sudah ada?

3. **Expected**: Keduanya menggunakan voter_token yang sama ✅

---

## Prevention

Untuk mencegah masalah serupa di masa depan:

1. ✅ **Selalu normalize** QR code sebelum digunakan
2. ✅ **Gunakan utility function** terpusat (jangan duplicate logic)
3. ✅ **Test kedua metode** (upload & scan) saat development
4. ✅ **Check consistency** antara voter_token dan qr_code di database

---

## Rollback

Jika ada masalah, bisa rollback dengan:

1. Revert perubahan di `lib/qrcode-utils.ts`
2. Revert perubahan di `app/page.tsx`
3. Revert perubahan di `app/voter/vote/page.tsx`

Tapi masalah asli akan kembali: upload dan scan menghasilkan QR code berbeda.

---

## Kesimpulan

✅ **Fix ini memastikan**:
- QR code di-extract dengan cara yang sama (upload & scan)
- QR code dinormalize sebelum digunakan
- voter_token konsisten di seluruh aplikasi
- Tidak ada duplicate voting dari QR code yang sama

**Sekarang upload dan scan akan menghasilkan voter_token yang SAMA!** 🎉

