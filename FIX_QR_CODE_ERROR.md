# 🔧 Perbaiki Error QR Code "Pemilihan tidak ditemukan atau tidak aktif"

Error ini muncul karena:
1. ✅ **Election tidak aktif** (`is_active = false`)
2. ✅ **Voting session tidak ada** atau tidak aktif
3. ✅ **Error 406** pada query elections

## ✅ Solusi

### LANGKAH 1: Pastikan Election Aktif

1. **Buka Admin Panel**
   - Buka: http://localhost:3000/admin
   - Pilih pemilihan yang ingin digunakan

2. **Aktifkan Election**
   - Di halaman detail election
   - Cari tombol toggle "Aktif" / "Tidak Aktif"
   - Atau ubah manual di database:
     ```sql
     UPDATE elections 
     SET is_active = true 
     WHERE id = 'your-election-id'::uuid;
     ```

3. **Verifikasi**
   - Cek status election di admin panel
   - Pastikan statusnya **"Aktif"** (bukan "Tidak Aktif")

### LANGKAH 2: Generate QR Code Baru

1. **Di Admin Panel**
   - Buka halaman detail election
   - Klik tab **"QR Code"**
   - Klik tombol **"Generate QR Code"**
   - QR code baru akan muncul

2. **Copy URL atau Scan QR Code**
   - Copy URL yang muncul di bawah QR code
   - Atau scan QR code dengan kamera

### LANGKAH 3: Test QR Code

1. **Buka URL QR Code**
   - Buka URL yang di-copy (contoh: `http://localhost:3000/voter?qrcode=voting-...`)
   - Atau scan QR code

2. **Cek Error**
   - Jika masih error, cek browser console (F12)
   - Lihat pesan error lengkap

### LANGKAH 4: Verifikasi di Database

Jika masih error, cek manual di Supabase:

**1. Cek Voting Session**
```sql
SELECT * FROM voting_sessions 
WHERE qr_code = 'voting-98d17fa6-7425-4887-9d1a-32e0f6ccf1c4-1763855612012'
  AND is_active = true;
```
Seharusnya mengembalikan 1 row.

**2. Cek Election**
```sql
SELECT id, title, is_active 
FROM elections 
WHERE id = '98d17fa6-7425-4887-9d1a-32e0f6ccf1c4';
```
Pastikan `is_active = true`.

**3. Aktifkan Election (jika perlu)**
```sql
UPDATE elections 
SET is_active = true 
WHERE id = '98d17fa6-7425-4887-9d1a-32e0f6ccf1c4'::uuid;
```

---

## 🔍 Troubleshooting

### Error 406 pada Elections Query

Error 406 biasanya masalah dengan query format atau RLS. Cek:

1. **RLS Policies sudah aktif?**
   - Di Supabase Dashboard → Table Editor → elections → Policies
   - Pastikan policy SELECT aktif

2. **Query Format Benar?**
   - Pastikan tidak ada karakter aneh di query
   - Coba query manual di SQL Editor

### QR Code Tidak Ditemukan

**1. Cek Voting Session**
```sql
SELECT * FROM voting_sessions 
WHERE qr_code LIKE 'voting-%'
ORDER BY created_at DESC;
```

**2. Generate QR Code Baru**
- Di admin panel → QR Code tab → Generate QR Code

### Election Tidak Aktif

**Cara 1: Via Admin Panel**
- Di admin panel, toggle election status ke "Aktif"

**Cara 2: Via SQL**
```sql
UPDATE elections 
SET is_active = true 
WHERE id = 'your-election-id'::uuid;
```

---

## ✅ Checklist

- [ ] Election sudah dibuat
- [ ] Election status **"Aktif"** (is_active = true)
- [ ] QR Code sudah di-generate dari admin panel
- [ ] Voting session sudah dibuat dan aktif
- [ ] RLS policies untuk elections dan voting_sessions aktif
- [ ] Test QR code di browser
- [ ] Tidak ada error 406 di console

---

File `app/voter/page.tsx` sudah diperbaiki dengan error handling yang lebih baik.

