## ✅ CHECKLIST SETUP

### Status saat ini:
- [x] File .env.local sudah dibuat
- [ ] Server perlu di-restart agar .env.local terbaca

### Langkah yang perlu dilakukan:

**1. RESTART DEVELOPMENT SERVER**

Di terminal yang sedang menjalankan `npm run dev`:
1. Tekan `Ctrl + C` untuk stop server
2. Jalankan lagi: `npm run dev`

> **Penting**: Environment variables hanya terbaca saat server pertama kali dijalankan.
> Jika .env.local dibuat setelah server running, HARUS restart!

**2. VERIFIKASI SETUP SUPABASE**

Pastikan di file .env.local sudah diisi dengan benar:
- ✅ NEXT_PUBLIC_SUPABASE_URL → URL project Anda (bukan placeholder)
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY → Anon key dari Supabase
- ✅ SUPABASE_SERVICE_ROLE_KEY → Service role key dari Supabase
- ✅ NEXT_PUBLIC_APP_URL=http://localhost:3000

**3. SETUP DATABASE**

Jika belum, jalankan SQL schema di Supabase:
1. Buka https://app.supabase.com
2. Pilih project Anda
3. Buka SQL Editor
4. Copy seluruh isi file: `supabase/schema.sql`
5. Paste dan Run

**4. TEST APLIKASI**

Setelah restart, buka:
- http://localhost:3000 → Akan redirect ke /voter
- http://localhost:3000/admin → Dashboard admin

### Jika masih error setelah restart:

Cek di browser console atau terminal untuk pesan error baru.
Error "supabaseKey is required" seharusnya sudah hilang setelah restart.

