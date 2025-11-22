# TROUBLESHOOTING: Error "supabaseKey is required"

## Masalah
Error ini muncul karena environment variables tidak terbaca dengan benar.

## Solusi Step-by-Step

### 1. CEK FORMAT FILE .env.local

Pastikan file `.env.local` di root folder dengan format:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**PENTING:**
- ✅ Tidak ada spasi sebelum/sesudah `=`
- ✅ Tidak ada tanda kutip (`"` atau `'`)
- ✅ Setiap variable di baris baru
- ✅ Tidak ada karakter aneh atau hidden characters

### 2. VERIFIKASI ISI FILE

Buka file `.env.local` dan pastikan:
- NEXT_PUBLIC_SUPABASE_URL dimulai dengan `https://`
- NEXT_PUBLIC_SUPABASE_ANON_KEY adalah string panjang (JWT token)
- SUPABASE_SERVICE_ROLE_KEY adalah string panjang (JWT token)
- Tidak ada teks "your-project" atau "your-anon-key-here" (harus diganti dengan nilai asli)

### 3. RESTART SERVER DENGAN BENAR

**Di terminal:**
```bash
# Stop server (Ctrl+C)
# Tunggu sampai benar-benar stop

# Hapus cache Next.js
rm -rf .next

# Start lagi
npm run dev
```

**Atau di Windows PowerShell:**
```powershell
# Stop server (Ctrl+C)
# Tunggu sampai benar-benar stop

# Hapus cache Next.js
Remove-Item -Recurse -Force .next

# Start lagi
npm run dev
```

### 4. CEK DI BROWSER CONSOLE

Setelah restart, buka browser console (F12) dan cek apakah masih ada error.

### 5. TEST ENVIRONMENT VARIABLES

Buat file test: `app/test-env/page.tsx`

```tsx
export default function TestEnv() {
  return (
    <div>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Ada' : '❌ Tidak ada'}</p>
      <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Ada' : '❌ Tidak ada'}</p>
    </div>
  )
}
```

Buka http://localhost:3000/test-env untuk cek apakah variables terbaca.

### 6. ALTERNATIF: Gunakan .env (bukan .env.local)

Jika masih tidak bekerja, coba buat file `.env` (tanpa .local):

```bash
# Copy .env.local ke .env
cp .env.local .env
```

Kemudian restart server.

### 7. CEK LOKASI FILE

Pastikan file `.env.local` ada di:
```
D:\My Project\voting\.env.local
```

Bukan di:
- `D:\My Project\.env.local` ❌
- `D:\My Project\voting\app\.env.local` ❌

### 8. VERIFIKASI SUPABASE CREDENTIALS

1. Buka https://app.supabase.com
2. Pilih project Anda
3. Settings → API
4. Copy:
   - **Project URL** → harus dimulai dengan `https://`
   - **anon public** key → string panjang (eyJ...)
   - **service_role** key → string panjang (eyJ...)

Pastikan tidak ada spasi atau karakter aneh saat copy-paste.

## Jika masih error:

1. Cek terminal output saat `npm run dev` - apakah ada warning tentang env?
2. Cek apakah file `.env.local` benar-benar ada di root folder
3. Coba buat ulang file `.env.local` dari awal
4. Pastikan tidak ada file `.env` lain yang conflict

