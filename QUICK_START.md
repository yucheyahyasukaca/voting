# Quick Start - Aplikasi Voting Supabase

Aplikasi voting dengan **Supabase Database** - data tersimpan permanen!

## 🚀 Langkah Cepat

### 1. Setup Environment Variables

Pastikan file `.env.local` sudah terisi dengan credentials Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Jalankan schema SQL di Supabase Dashboard → SQL Editor:
- File: `supabase/schema.sql`

### 4. Jalankan Aplikasi

```bash
npm run dev
```

### 5. Akses Aplikasi

- **Admin Panel**: http://localhost:3000/admin
- **Voter Interface**: http://localhost:3000/voter
- **Home**: http://localhost:3000

## ✅ Fitur yang Tersedia

- ✅ Admin panel lengkap
- ✅ Kelola pemilihan & kandidat
- ✅ Upload banner (Supabase Storage)
- ✅ Generate QR code untuk voting
- ✅ Real-time voting results
- ✅ Data persistence di Supabase PostgreSQL
- ✅ Support multiple categories (opsional)

## 📝 Catatan Penting

- ✅ **Data tersimpan permanen** di Supabase Database
- ✅ Dapat diakses dari **berbagai device**
- ✅ **Auto backup** oleh Supabase
- ✅ **Real-time updates** menggunakan Supabase Realtime
- ✅ **Scalable** untuk ratusan user bersamaan

## 🎯 Test Flow

1. Buka `/admin` → Buat pemilihan baru
2. Tambah kandidat (minimal 2 kandidat)
3. Aktifkan pemilihan
4. Tab "QR Code" → Generate QR code
5. Scan QR code atau copy URL untuk voting
6. Vote di halaman voter
7. Lihat hasil real-time di tab "Hasil Voting"

## 🔧 Troubleshooting

Jika ada masalah:
- Lihat `SUPABASE_CONNECTION.md` untuk info koneksi database
- Lihat `SETUP_DATABASE.md` untuk setup database
- Lihat `TROUBLESHOOTING.md` untuk solusi umum

**Selamat mencoba!** 🎉

