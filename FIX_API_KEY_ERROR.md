# 🔧 Perbaiki Error "Invalid API key"

Error ini muncul karena:
1. File `.env.local` belum dibuat, ATAU
2. API key di `.env.local` tidak valid/salah, ATAU
3. Server belum di-restart setelah membuat/mengubah `.env.local`

## ✅ Solusi Step-by-Step

### LANGKAH 1: Cek apakah file .env.local sudah ada

1. Buka folder project: `D:\My Project\voting`
2. Cari file `.env.local`
3. Jika **TIDAK ADA**, lanjut ke Langkah 2
4. Jika **SUDAH ADA**, buka dan cek isinya

### LANGKAH 2: Buat/Edit file .env.local

**Cara 1: Manual (Recommended)**

1. Di folder project, buat file baru dengan nama: `.env.local`
2. Copy dan paste template berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Cara 2: Menggunakan PowerShell**

Di terminal PowerShell, jalankan:
```powershell
cd "D:\My Project\voting"
New-Item -Path .env.local -ItemType File -Force
```

Kemudian buka file `.env.local` dan isi dengan credentials.

### LANGKAH 3: Dapatkan Credentials dari Supabase

1. **Buka Supabase Dashboard**
   - Pergi ke: https://app.supabase.com
   - Login ke akun Anda

2. **Pilih atau Buat Project**
   - Jika belum ada project, klik "New Project"
   - Isi nama project, pilih region, buat database password
   - Tunggu hingga project siap (1-2 menit)

3. **Dapatkan API Credentials**
   - Di sidebar kiri, klik **"Settings"** (icon gear ⚙️)
   - Klik **"API"** di menu Settings
   
4. **Copy Credentials**
   
   Di halaman API Settings, Anda akan melihat:
   
   **a. Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   Copy URL ini → ini adalah nilai untuk `NEXT_PUBLIC_SUPABASE_URL`
   
   **b. Project API keys**
   
   Ada beberapa keys yang tersedia:
   
   - **`anon` `public`** key
     - Klik tombol "Reveal" atau icon eye 👁️ untuk melihat key
     - Copy seluruh key (sangat panjang, dimulai dengan `eyJ...`)
     - Ini adalah nilai untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   
   - **`service_role` `secret`** key
     - Klik tombol "Reveal" untuk melihat key
     - Copy seluruh key (sangat panjang)
     - **PENTING**: Key ini sangat sensitif! Jangan share ke siapa pun
     - Ini adalah nilai untuk `SUPABASE_SERVICE_ROLE_KEY`

### LANGKAH 4: Isi file .env.local

Buka file `.env.local` dan isi dengan credentials yang sudah di-copy:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ2OTI3MjAwLCJleHAiOjE5NjI1MDMyMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDY5MjcyMDAsImV4cCI6MTk2MjUwMzIwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ PENTING:**
- Ganti `xxxxxxxxxxxxx` dengan ID project Anda yang sebenarnya
- Ganti `eyJ...` dengan key yang sebenarnya (sangat panjang!)
- **TIDAK ADA** spasi sebelum/sesudah tanda `=`
- **TIDAK ADA** tanda kutip (`"` atau `'`) di sekeliling nilai
- Setiap variable di baris baru
- Pastikan tidak ada karakter tersembunyi

### LANGKAH 5: Setup Database Schema

Sebelum menggunakan aplikasi, Anda perlu membuat tabel di database:

1. Di Supabase Dashboard, klik **"SQL Editor"** di sidebar
2. Klik **"New query"**
3. Buka file `supabase/schema.sql` di project Anda
4. Copy **seluruh isi** file tersebut
5. Paste ke SQL Editor di Supabase
6. Klik **"Run"** (atau tekan `Ctrl+Enter`)
7. Tunggu hingga selesai - Anda akan melihat pesan sukses

### LANGKAH 6: Restart Development Server

**INI PENTING!** Environment variables hanya terbaca saat server pertama kali start.

1. Di terminal yang menjalankan `npm run dev`:
   - Tekan **`Ctrl + C`** untuk stop server
   - **Tunggu** hingga benar-benar stop

2. Hapus cache Next.js (opsional tapi recommended):
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```

3. Start server lagi:
   ```bash
   npm run dev
   ```

### LANGKAH 7: Verifikasi

1. **Test Environment Variables**
   - Buka browser: http://localhost:3000/test-env
   - Cek apakah semua environment variables sudah terbaca

2. **Test Aplikasi**
   - Buka: http://localhost:3000/admin
   - Coba buat pemilihan baru
   - Jika tidak ada error, berarti sudah berhasil!

3. **Cek Browser Console**
   - Tekan **F12** untuk buka DevTools
   - Lihat tab **Console**
   - Seharusnya tidak ada error tentang "Invalid API key"

---

## 🔍 Troubleshooting

### Masih error "Invalid API key" setelah restart?

1. **Cek format file .env.local**
   - Pastikan tidak ada spasi di awal/setelah `=`
   - Pastikan tidak ada tanda kutip
   - Pastikan setiap variable di baris baru

2. **Cek credentials**
   - Pastikan URL dimulai dengan `https://` dan berakhir dengan `.supabase.co`
   - Pastikan anon key sangat panjang (biasanya 200+ karakter)
   - Pastikan service_role key juga sangat panjang

3. **Cek apakah file benar-benar bernama `.env.local`**
   - Bukan `.env.local.txt`
   - Bukan `env.local`
   - Pastikan ada titik di awal: `.env.local`

4. **Cek lokasi file**
   - File harus di root folder project: `D:\My Project\voting\.env.local`
   - Bukan di subfolder lain

5. **Coba hapus cache dan restart lagi**
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

### Error 401 Unauthorized di console?

Ini berarti API key tidak valid. Cek kembali:
- Anon key sudah di-copy dengan lengkap (tidak terpotong)
- Tidak ada spasi di awal/akhir key
- Key dari Supabase Dashboard → Settings → API → anon public key

### Server tidak restart?

- Pastikan benar-benar stop dengan `Ctrl+C`
- Tutup terminal dan buka terminal baru
- Jalankan `npm run dev` lagi

---

## ✅ Checklist

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] File `.env.local` sudah dibuat di root folder
- [ ] Project Supabase sudah dibuat
- [ ] API credentials sudah di-copy dari Supabase Dashboard
- [ ] File `.env.local` sudah diisi dengan credentials yang benar
- [ ] Database schema sudah dijalankan di SQL Editor
- [ ] Development server sudah di-restart (stop → start)
- [ ] Cache Next.js sudah dihapus (opsional)
- [ ] Test di http://localhost:3000/test-env menunjukkan semua variables terbaca
- [ ] Tidak ada error "Invalid API key" di browser console

---

## 📞 Butuh Bantuan?

Jika masih error setelah mengikuti semua langkah:
1. Cek file `CARA_SETUP_ENV.txt` untuk panduan detail
2. Cek file `TROUBLESHOOTING.md` untuk masalah umum
3. Buka http://localhost:3000/test-env untuk test environment variables

