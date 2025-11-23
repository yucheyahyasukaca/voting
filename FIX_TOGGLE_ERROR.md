# 🔧 Perbaiki Error Toggle "Izinkan Melihat Hasil Live"

Error 400 (Bad Request) pada PATCH request biasanya karena:
1. RLS policy UPDATE belum aktif atau salah
2. Format data yang dikirim tidak sesuai
3. Kolom `allow_view_results` tidak ada atau tipe datanya salah

## ✅ Solusi

### LANGKAH 1: Verifikasi RLS Policy untuk UPDATE

1. Buka Supabase Dashboard → Table Editor → Pilih tabel `elections`
2. Klik tab **"Policies"**
3. Pastikan ada policy untuk UPDATE dengan nama:
   - **"Elections can be updated by anyone"**
   - Status: **Aktif** ✅
   - Operation: **UPDATE**

Jika tidak ada, jalankan query ini di SQL Editor:

```sql
-- Pastikan RLS enabled
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;

-- Drop policy lama jika ada
DROP POLICY IF EXISTS "Elections can be updated by anyone" ON elections;

-- Buat policy UPDATE
CREATE POLICY "Elections can be updated by anyone" ON elections
    FOR UPDATE USING (true);
```

### LANGKAH 2: Verifikasi Kolom `allow_view_results`

Jalankan query ini di SQL Editor untuk cek apakah kolom ada:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'elections' AND column_name = 'allow_view_results';
```

Jika kolom tidak ada, tambahkan:

```sql
ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS allow_view_results BOOLEAN DEFAULT false;
```

### LANGKAH 3: Test Update Manual

Jalankan query ini untuk test update (ganti `your-election-id` dengan ID election yang ada):

```sql
UPDATE elections 
SET allow_view_results = true 
WHERE id = 'your-election-id'::uuid
RETURNING id, title, allow_view_results;
```

Jika query ini berhasil, berarti masalahnya di kode aplikasi, bukan database.

### LANGKAH 4: Refresh Browser

Setelah perbaikan:
1. Refresh browser dengan **hard refresh** (Ctrl+Shift+R)
2. Coba toggle lagi

---

## 🔍 Troubleshooting

### Masih Error 400?

1. **Cek Browser Console**
   - Buka DevTools (F12) → Console tab
   - Lihat pesan error lengkap
   - Copy error message

2. **Cek Network Tab**
   - Buka DevTools (F12) → Network tab
   - Cari request PATCH ke `/rest/v1/elections`
   - Lihat Request Payload dan Response

3. **Test dengan curl** (jika perlu):
```bash
curl -X PATCH 'https://your-project.supabase.co/rest/v1/elections?id=eq.your-election-id' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"allow_view_results": true}'
```

### Error 406 pada votes table?

Error 406 biasanya masalah dengan headers Accept. Cek:
1. RLS policy untuk SELECT pada votes table sudah aktif
2. Query format sudah benar (tidak ada masalah di kode)

---

## ✅ Checklist

- [ ] RLS policy UPDATE untuk elections sudah ada dan aktif
- [ ] Kolom `allow_view_results` ada di tabel elections
- [ ] Test update manual berhasil
- [ ] Browser sudah di-refresh (hard refresh)
- [ ] Tidak ada error di console setelah refresh

---

File `app/admin/elections/[id]/page.tsx` sudah diperbaiki dengan error handling yang lebih baik.

