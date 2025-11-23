# ⚡ Quick Fix: QR Code Tidak Bisa di-Scan

Error "Pemilihan tidak ditemukan atau tidak aktif" muncul karena election belum aktif atau QR code belum di-generate.

## 🚀 Solusi Cepat (2 menit)

### 1️⃣ Aktifkan Election

**Cara 1: Via Admin Panel**
1. Buka http://localhost:3000/admin
2. Pilih pemilihan yang ingin digunakan
3. Klik tombol toggle **"Tidak Aktif"** → Ubah ke **"Aktif"**

**Cara 2: Via SQL** (jika toggle tidak bekerja)
```sql
UPDATE elections 
SET is_active = true 
WHERE id = '98d17fa6-7425-4887-9d1a-32e0f6ccf1c4'::uuid;
```
(Ganti ID dengan ID election Anda)

### 2️⃣ Generate QR Code Baru

1. Di Admin Panel → Pilih election
2. Klik tab **"QR Code"**
3. Klik tombol **"Generate QR Code"**
4. QR code akan muncul

### 3️⃣ Test QR Code

1. **Copy URL** dari bawah QR code
2. **Buka URL** di browser baru
3. Seharusnya bisa masuk ke halaman voter! ✅

---

## 🔍 Checklist

- [ ] Election sudah dibuat
- [ ] Election status **AKTIF** (bukan Tidak Aktif)
- [ ] QR Code sudah di-generate
- [ ] Voting session sudah dibuat (otomatis saat generate QR code)
- [ ] Test buka URL QR code

---

## ❓ Masih Error?

**Error 406:**
- Cek RLS policies untuk elections sudah aktif
- Jalankan script `fix_rls_policies.sql` jika perlu

**Error "QR Code tidak valid":**
- Generate QR code baru di admin panel
- Pastikan voting_sessions sudah dibuat

**Error "Pemilihan tidak aktif":**
- Aktifkan election di admin panel
- Atau set is_active = true via SQL

---

Lihat `FIX_QR_CODE_ERROR.md` untuk panduan lengkap.

