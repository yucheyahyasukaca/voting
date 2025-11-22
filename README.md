# Aplikasi Voting

Aplikasi voting modern, ringan, dan scalable dengan dukungan ratusan pengguna bersamaan. Dibangun dengan Next.js 14, TypeScript, Tailwind CSS, dan Supabase.

## Fitur

- **Admin Panel**: Kelola pemilihan, upload banner, kelola kandidat, lihat hasil voting
- **Voting Interface**: Interface mobile-first untuk voter
- **QR Code**: Generate QR code untuk akses voting
- **Real-time Results**: Hasil voting real-time menggunakan Supabase Realtime
- **Scalable**: Dapat menangani ratusan pengguna bersamaan
- **Bahasa Indonesia**: Semua interface dalam bahasa Indonesia

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL schema dari `supabase/schema.sql` di SQL Editor Supabase
3. Buat Storage bucket untuk menyimpan gambar (opsional):
   - Buat bucket dengan nama `elections`
   - Set policy untuk public read access

### 3. Setup Environment Variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

## Cara Menggunakan

### Untuk Admin

1. Akses `/admin` untuk dashboard admin
2. Buat pemilihan baru
3. Tambah kandidat
4. Generate QR code untuk voting
5. Upload banner hero section (opsional)
6. Lihat hasil voting real-time

### Untuk Voter

1. Scan QR code yang dihasilkan admin
2. Pilih kandidat
3. Konfirmasi pilihan
4. Lihat hasil voting (opsional)

## Struktur Database

- `elections`: Data pemilihan
- `candidates`: Data kandidat
- `votes`: Data suara yang diberikan
- `voting_sessions`: Sesi voting dengan QR code
- `users`: Data pengguna (untuk autentikasi admin, opsional)

## Teknologi

- **Next.js 14**: React framework dengan App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Supabase**: Database dan real-time updates
- **QRCode.react**: Generate QR code

## Deployment

Aplikasi dapat di-deploy ke Vercel, Netlify, atau platform lainnya. Pastikan environment variables sudah di-set dengan benar.

## Catatan

- Untuk production, implementasikan autentikasi admin yang proper
- Gunakan Supabase Storage untuk upload gambar banner dan foto kandidat
- Pastikan RLS (Row Level Security) policies di-set dengan benar di Supabase

