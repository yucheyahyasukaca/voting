# Panduan Setup Aplikasi Voting

## Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis di https://supabase.com)

## Langkah Setup Lengkap

### 1. Clone dan Install

```bash
# Install dependencies
npm install
```

### 2. Setup Supabase

#### A. Buat Project Supabase

1. Kunjungi https://supabase.com dan buat akun/login
2. Klik "New Project"
3. Isi detail project:
   - Name: voting-app (atau nama lain)
   - Database Password: buat password yang kuat
   - Region: pilih yang terdekat (Singapore untuk Indonesia)
4. Tunggu hingga project selesai dibuat (sekitar 2 menit)

#### B. Setup Database Schema

1. Di Supabase Dashboard, buka **SQL Editor** di sidebar kiri
2. Klik **New Query**
3. Copy seluruh isi file `supabase/schema.sql`
4. Paste ke SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`
6. Pastikan tidak ada error

#### C. Setup Storage (Opsional - untuk upload gambar)

1. Di Supabase Dashboard, buka **Storage** di sidebar
2. Klik **New bucket**
3. Nama bucket: `elections`
4. Pilih **Public bucket** (untuk akses public)
5. Klik **Create bucket**

Untuk upload gambar via API, buat policy:

1. Buka **Storage** > **Policies**
2. Klik **New Policy** untuk bucket `elections`
3. Pilih **For full customization**
4. Copy policy berikut:

```sql
-- Policy untuk upload (admin only - sesuaikan dengan auth system Anda)
CREATE POLICY "Allow upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'elections');

-- Policy untuk public read
CREATE POLICY "Public read" ON storage.objects
FOR SELECT USING (bucket_id = 'elections');
```

### 3. Setup Environment Variables

1. Copy file `.env.example` menjadi `.env.local`:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

2. Buka `.env.local` dan isi dengan data dari Supabase:

   - Buka Supabase Dashboard > **Settings** > **API**
   - Copy **Project URL** → paste ke `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → paste ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → paste ke `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` (untuk development)

Contoh `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Buka browser di http://localhost:3000

## Cara Menggunakan

### Sebagai Admin

1. **Akses Dashboard Admin**
   - Buka http://localhost:3000/admin

2. **Buat Pemilihan Baru**
   - Klik "Buat Pemilihan Baru"
   - Isi judul, deskripsi, tanggal
   - (Opsional) Masukkan URL banner hero section
   - Klik "Buat Pemilihan"

3. **Tambah Kandidat**
   - Klik "Kelola" pada pemilihan yang dibuat
   - Tab "Kandidat" > "Tambah Kandidat"
   - Isi nama, deskripsi, URL foto (opsional)
   - Set urutan tampil
   - Klik "Tambah Kandidat"

4. **Generate QR Code**
   - Tab "QR Code" > "Generate QR Code"
   - QR code akan muncul
   - Share QR code ini ke voter

5. **Lihat Hasil Voting**
   - Tab "Hasil Voting" > "Lihat Hasil Live"
   - Hasil akan update secara real-time

### Sebagai Voter

1. **Scan QR Code**
   - Buka kamera di smartphone
   - Scan QR code yang diberikan admin
   - Atau buka link yang ada di QR code

2. **Pilih Kandidat**
   - Lihat daftar kandidat
   - Klik kandidat pilihan

3. **Konfirmasi**
   - Review pilihan
   - Klik "Konfirmasi Suara"

4. **Selesai**
   - Akan muncul halaman sukses
   - Bisa lihat hasil live (opsional)

## Upload Gambar ke Supabase Storage

### Via Supabase Dashboard

1. Buka **Storage** > **elections** bucket
2. Klik **Upload file**
3. Upload gambar
4. Klik file yang diupload
5. Copy **Public URL**
6. Paste URL ke form admin

### Via API (Advanced)

Gunakan Supabase Storage API untuk upload programmatically. Contoh:

```typescript
const { data, error } = await supabase.storage
  .from('elections')
  .upload(`banners/${filename}`, file)

if (!error) {
  const { data: { publicUrl } } = supabase.storage
    .from('elections')
    .getPublicUrl(`banners/${filename}`)
  // Gunakan publicUrl
}
```

## Troubleshooting

### Error: "Invalid API key"
- Pastikan environment variables sudah benar
- Restart development server setelah mengubah `.env.local`

### Error: "relation does not exist"
- Pastikan schema SQL sudah dijalankan di Supabase
- Cek di Supabase Dashboard > **Table Editor** apakah tabel sudah ada

### QR Code tidak muncul
- Pastikan `qrcode.react` sudah terinstall: `npm install`
- Cek console browser untuk error

### Real-time tidak bekerja
- Pastikan Supabase Realtime sudah enabled
- Cek di Supabase Dashboard > **Database** > **Replication**
- Enable replication untuk tabel `votes`

## Production Deployment

1. **Deploy ke Vercel** (Recommended):
   ```bash
   npm install -g vercel
   vercel
   ```
   - Set environment variables di Vercel Dashboard

2. **Update `NEXT_PUBLIC_APP_URL`**:
   - Ganti dengan URL production (contoh: `https://your-app.vercel.app`)

3. **Setup Custom Domain** (Opsional):
   - Di Vercel, tambah custom domain
   - Update `NEXT_PUBLIC_APP_URL` dengan domain baru

## Security Notes

- Jangan commit `.env.local` ke git
- Untuk production, implementasikan autentikasi admin yang proper
- Setup Row Level Security (RLS) di Supabase untuk keamanan tambahan
- Gunakan HTTPS untuk production

## Support

Jika ada masalah, cek:
- Console browser untuk error frontend
- Supabase Dashboard > **Logs** untuk error backend
- Network tab di browser DevTools untuk request yang gagal

