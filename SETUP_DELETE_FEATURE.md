# Setup DELETE Policy untuk Hapus Pemilihan

## ⚠️ PENTING: Jalankan Query SQL Ini Dulu

Sebelum bisa menghapus pemilihan, Anda perlu menambahkan DELETE policy ke database Supabase.

### Langkah 1: Buka Supabase SQL Editor

1. Buka dashboard Supabase: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik **New Query**

### Langkah 2: Copy & Paste Query Berikut

```sql
-- Add DELETE policies for elections and voting_sessions
-- This allows deletion of elections and voting_sessions with cascade

-- Elections DELETE policy
CREATE POLICY "Elections can be deleted by anyone" ON elections
    FOR DELETE USING (true);

-- Voting sessions DELETE policy  
CREATE POLICY "Voting sessions can be deleted by anyone" ON voting_sessions
    FOR DELETE USING (true);

-- Votes DELETE policy (untuk cleanup data jika diperlukan)
CREATE POLICY "Votes can be deleted by anyone" ON votes
    FOR DELETE USING (true);

-- Note: Dalam produksi, sebaiknya batasi DELETE hanya untuk admin yang terautentikasi
-- Contoh: FOR DELETE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');
```

### Langkah 3: Run Query

1. Paste query di atas ke SQL Editor
2. Klik tombol **Run** (atau tekan Ctrl+Enter / Cmd+Enter)
3. Tunggu sampai muncul pesan "Success. No rows returned"

### Langkah 4: Test Delete

1. Buka aplikasi: http://localhost:3000/admin (development) atau URL production
2. Klik button **Hapus** pada pemilihan yang ingin dihapus
3. Modal konfirmasi akan muncul
4. Klik **Ya, Hapus** untuk menghapus atau **Batal** untuk membatalkan

## ✅ Fitur Delete yang Sudah Ditambahkan

### 1. Button Hapus di Admin Dashboard

Setiap card pemilihan sekarang memiliki button merah "Hapus" di samping button Aktifkan/Nonaktifkan.

### 2. Modal Konfirmasi

Modal konfirmasi yang cantik dengan informasi lengkap:
- Judul pemilihan
- Tanggal mulai dan berakhir
- Warning tentang data yang akan dihapus:
  - Semua kategori
  - Semua kandidat
  - Semua suara (votes)
  - Semua QR codes
- Button "Ya, Hapus" dan "Batal"

### 3. Cascade Delete Otomatis

Ketika Anda menghapus pemilihan, database akan otomatis menghapus:
- ✅ Semua kategori terkait (via CASCADE)
- ✅ Semua kandidat terkait (via CASCADE)
- ✅ Semua votes terkait (via CASCADE)
- ✅ Semua QR codes terkait (via CASCADE)

### 4. Loading State

Button "Ya, Hapus" akan berubah menjadi "Menghapus..." saat proses delete sedang berjalan.

## 🧪 Testing Checklist

- [x] Modal konfirmasi muncul saat klik button Hapus
- [x] Button Batal menutup modal
- [ ] Button "Ya, Hapus" menghapus pemilihan (perlu run SQL query dulu)
- [ ] Data terkait (kategori, kandidat, votes, QR codes) terhapus otomatis
- [ ] Dashboard refresh setelah delete berhasil

## 🔒 Keamanan Production (Opsional)

Untuk production, sebaiknya batasi DELETE hanya untuk admin yang terautentikasi:

```sql
-- Hapus policy yang ada
DROP POLICY "Elections can be deleted by anyone" ON elections;
DROP POLICY "Voting sessions can be deleted by anyone" ON voting_sessions;
DROP POLICY "Votes can be deleted by anyone" ON votes;

-- Buat policy yang lebih aman (hanya untuk admin terautentikasi)
CREATE POLICY "Elections can be deleted by authenticated admins" ON elections
    FOR DELETE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Voting sessions can be deleted by authenticated admins" ON voting_sessions
    FOR DELETE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Votes can be deleted by authenticated admins" ON votes
    FOR DELETE USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');
```

## 📝 Catatan

- Hapus pemilihan bersifat **permanen** dan **tidak bisa dibatalkan**
- Pastikan Anda benar-benar ingin menghapus sebelum klik "Ya, Hapus"
- Untuk production, gunakan autentikasi admin yang lebih aman
- Database schema sudah memiliki CASCADE DELETE, jadi tidak perlu khawatir tentang data orphan

## ❓ Troubleshooting

### Error: "new row violates row-level security policy"

**Penyebab:** DELETE policy belum ditambahkan  
**Solusi:** Jalankan query SQL di Langkah 2

### Error: "permission denied for table elections"

**Penyebab:** Tidak memiliki akses ke database  
**Solusi:** Pastikan menggunakan anon key yang benar di .env.local

### Delete tidak berhasil tapi tidak ada error

**Penyebab:** Kemungkinan ada constraint yang belum ter-handle  
**Solusi:** Cek console browser (F12) untuk error detail

