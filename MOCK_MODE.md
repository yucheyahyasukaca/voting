# Aplikasi Voting - Mock Mode

Aplikasi sekarang menggunakan **mock data** yang disimpan di localStorage. Semua fitur berfungsi tanpa perlu setup Supabase!

## ✅ Fitur yang Tersedia

- ✅ **Admin Panel**: Buat pemilihan, kelola kandidat, generate QR code
- ✅ **Voting Interface**: Voter bisa scan QR code dan memberikan suara
- ✅ **Hasil Voting**: Lihat hasil voting real-time
- ✅ **Data Persistence**: Data tersimpan di browser localStorage

## 🚀 Cara Menggunakan

### 1. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:3000

### 2. Akses Admin Panel

Buka http://localhost:3000/admin

**Data Sample Sudah Tersedia:**
- 1 pemilihan aktif: "Pemilihan Ketua Umum 2024"
- 3 kandidat: John Smith, Michael Lee, Emily Wong

### 3. Generate QR Code

1. Di admin panel, klik "Kelola" pada pemilihan
2. Tab "QR Code" → Klik "Generate QR Code"
3. QR code akan muncul
4. Copy URL atau scan QR code untuk test voting

### 4. Test Voting

1. Buka URL dari QR code (atau buka `/voter?qrcode=...`)
2. Pilih kandidat
3. Konfirmasi suara
4. Lihat hasil voting

## 📝 Catatan Penting

### Data Storage
- Semua data disimpan di **localStorage** browser
- Data akan hilang jika:
  - Clear browser data
  - Gunakan browser lain/incognito
  - Gunakan device lain

### Mock vs Real Supabase

**Saat ini menggunakan:** Mock Data (localStorage)
- File: `lib/supabase-mock.ts`
- Import: `import { supabase } from '@/lib/supabase-mock'`

**Untuk switch ke Supabase real:**
1. Setup Supabase (lihat `SETUP.md`)
2. Ganti semua import dari `@/lib/supabase-mock` ke `@/lib/supabase`
3. Pastikan `.env.local` sudah diisi dengan credentials Supabase

## 🔄 Migrasi ke Supabase

Ketika siap untuk menggunakan Supabase:

1. **Setup Supabase:**
   - Buat project di https://supabase.com
   - Jalankan SQL schema dari `supabase/schema.sql`
   - Dapatkan credentials (URL, anon key, service role key)

2. **Update Environment Variables:**
   - Buat/update `.env.local` dengan credentials Supabase

3. **Ganti Import:**
   ```bash
   # Find and replace di semua file:
   # FROM: import { supabase } from '@/lib/supabase-mock'
   # TO:   import { supabase } from '@/lib/supabase'
   ```

4. **Migrate Data (Opsional):**
   - Export data dari localStorage
   - Import ke Supabase menggunakan SQL atau Supabase Dashboard

## 🐛 Troubleshooting

### Data tidak muncul?
- Cek browser console untuk error
- Pastikan localStorage tidak di-disable
- Coba refresh halaman

### QR Code tidak bekerja?
- Pastikan QR code sudah di-generate dari admin panel
- Check URL di QR code apakah benar

### Voting tidak tersimpan?
- Cek browser console untuk error
- Pastikan tidak ada duplicate vote (satu QR code = satu suara)

## 📊 Struktur Data Mock

Data disimpan dengan key berikut di localStorage:
- `mock_elections` - Data pemilihan
- `mock_candidates` - Data kandidat
- `mock_votes` - Data suara
- `mock_sessions` - Data QR code sessions

Untuk melihat data, buka browser DevTools → Application → Local Storage

