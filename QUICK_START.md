# Quick Start - Mock Mode

Aplikasi voting sekarang menggunakan **mock data** - tidak perlu setup Supabase!

## 🚀 Langkah Cepat

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan aplikasi:**
   ```bash
   npm run dev
   ```

3. **Buka browser:**
   - Admin: http://localhost:3000/admin
   - Voter: http://localhost:3000/voter

## ✅ Yang Sudah Tersedia

- ✅ Sample data (1 pemilihan, 3 kandidat)
- ✅ Admin panel lengkap
- ✅ Voting interface
- ✅ QR code generation
- ✅ Real-time results (simulated)
- ✅ Data persistence (localStorage)

## 📝 Catatan

- Data tersimpan di browser localStorage
- Tidak perlu setup Supabase untuk development
- Semua fitur berfungsi seperti aplikasi real
- Untuk production, bisa switch ke Supabase (lihat `MOCK_MODE.md`)

## 🎯 Test Flow

1. Buka `/admin`
2. Klik "Kelola" pada pemilihan yang ada
3. Tab "QR Code" → Generate QR code
4. Copy URL atau scan QR code
5. Vote di halaman voter
6. Lihat hasil di tab "Hasil Voting"

**Selamat mencoba!** 🎉

