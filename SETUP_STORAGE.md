# 📦 Setup Supabase Storage untuk Upload Foto

Sebelum menggunakan fitur upload foto, Anda perlu setup Supabase Storage bucket "elections".

## ✅ Langkah-langkah Setup

### LANGKAH 1: Buat Storage Bucket

1. Buka Supabase Dashboard: https://app.supabase.com
2. Pilih project Anda: `hhwcmobnvosaombczeje`
3. Di sidebar kiri, klik **"Storage"**
4. Klik tombol **"New bucket"** (atau "Create bucket")
5. Isi form:
   - **Name**: `elections`
   - **Public bucket**: ✅ **Centang** (agar gambar bisa diakses public)
   - **File size limit**: Biarkan default atau set sesuai kebutuhan
   - **Allowed MIME types**: Biarkan kosong atau isi `image/*`
6. Klik **"Create bucket"**

### LANGKAH 2: Setup Storage Policies

Setelah bucket dibuat, setup policies agar file bisa diupload dan diakses:

1. Di halaman Storage, klik bucket **"elections"**
2. Klik tab **"Policies"** di bagian atas
3. Klik **"New policy"** → Pilih **"Create a policy from scratch"**

**Policy 1: Allow Public Read Access**
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT` (Read)
- **Policy definition**: 
  ```sql
  (bucket_id = 'elections')
  ```
- Klik **"Review"** → **"Save policy"**

**Policy 2: Allow Authenticated Upload**
- **Policy name**: `Authenticated upload`
- **Allowed operation**: `INSERT` (Upload)
- **Policy definition**:
  ```sql
  (bucket_id = 'elections')
  ```
- Klik **"Review"** → **"Save policy"**

**Policy 3: Allow Update (untuk replace file)**
- **Policy name**: `Allow update`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  (bucket_id = 'elections')
  ```
- Klik **"Review"** → **"Save policy"**

**Policy 4: Allow Delete**
- **Policy name**: `Allow delete`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  (bucket_id = 'elections')
  ```
- Klik **"Review"** → **"Save policy"**

### LANGKAH 3: Verifikasi

1. Buka bucket "elections" di Storage
2. Coba upload file test (klik "Upload file")
3. Pastikan file bisa diupload dan bisa diakses

---

## 🔧 Alternatif: Setup via SQL (Advanced)

Jika ingin setup via SQL Editor, jalankan query ini:

```sql
-- Create bucket (jika belum ada)
INSERT INTO storage.buckets (id, name, public)
VALUES ('elections', 'elections', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'elections');

-- Policy: Allow upload
CREATE POLICY "Allow upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'elections');

-- Policy: Allow update
CREATE POLICY "Allow update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'elections');

-- Policy: Allow delete
CREATE POLICY "Allow delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'elections');
```

---

## ✅ Checklist

- [ ] Bucket "elections" sudah dibuat
- [ ] Bucket bersifat **public** (untuk akses public)
- [ ] Policy SELECT (read) sudah dibuat dan aktif
- [ ] Policy INSERT (upload) sudah dibuat dan aktif
- [ ] Test upload file berhasil
- [ ] File yang diupload bisa diakses via URL

---

## 🆘 Troubleshooting

### Error: "Bucket not found"
- Pastikan bucket "elections" sudah dibuat
- Cek nama bucket harus tepat: `elections` (huruf kecil)

### Error: "new row violates row-level security policy"
- Pastikan policy INSERT sudah dibuat dan aktif
- Cek policy definition harus benar: `(bucket_id = 'elections')`

### Error: "File not found" setelah upload
- Pastikan bucket bersifat **public**
- Cek policy SELECT sudah aktif
- Pastikan URL yang digunakan adalah public URL

### File terlalu besar
- Cek file size limit di bucket settings
- Atau kompres gambar sebelum upload

---

## 📝 Catatan

- File akan diupload ke folder `candidates/` di dalam bucket "elections"
- Format filename: `candidates/{timestamp}_{random}.{ext}`
- Public URL akan otomatis di-generate setelah upload berhasil

