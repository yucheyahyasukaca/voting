# 📦 Setup Storage via Dashboard (Tidak Perlu SQL)

Karena error permission, kita perlu setup Storage bucket dan policies via Dashboard UI.

## ✅ Langkah-langkah Setup

### LANGKAH 1: Buat Storage Bucket

1. **Buka Supabase Dashboard**
   - https://app.supabase.com
   - Login dan pilih project: `hhwcmobnvosaombczeje`

2. **Buka Storage**
   - Di sidebar kiri, klik **"Storage"**

3. **Buat Bucket Baru**
   - Klik tombol **"New bucket"** (atau **"Create bucket"**)
   - Isi form:
     - **Name**: `elections` (harus tepat!)
     - **Public bucket**: ✅ **Centang** (penting!)
     - **File size limit**: Biarkan default atau set ke 50MB (52428800 bytes)
     - **Allowed MIME types**: Biarkan kosong atau isi `image/*`
   - Klik **"Create bucket"**

### LANGKAH 2: Setup Storage Policies (PENTING!)

Setelah bucket dibuat, kita perlu setup policies:

1. **Buka Bucket Policies**
   - Di Storage → Klik bucket **"elections"**
   - Klik tab **"Policies"** di bagian atas

2. **Buat Policy 1: Public Read Access**
   - Klik **"New policy"**
   - Pilih **"Create a policy from scratch"**
   - **Policy name**: `Public read elections`
   - **Allowed operation**: Pilih **"SELECT (Read)"**
   - **Policy definition**:
     ```sql
     (bucket_id = 'elections')
     ```
   - Klik **"Review"** → **"Save policy"**

3. **Buat Policy 2: Allow Upload** ⚠️ **INI YANG PENTING!**
   - Klik **"New policy"**
   - Pilih **"Create a policy from scratch"**
   - **Policy name**: `Allow upload elections`
   - **Allowed operation**: Pilih **"INSERT (Upload)"**
   - **Policy definition**:
     ```sql
     (bucket_id = 'elections')
     ```
   - Klik **"Review"** → **"Save policy"**

4. **Buat Policy 3: Allow Update**
   - Klik **"New policy"**
   - Pilih **"Create a policy from scratch"**
   - **Policy name**: `Allow update elections`
   - **Allowed operation**: Pilih **"UPDATE"**
   - **Policy definition**:
     ```sql
     (bucket_id = 'elections')
     ```
   - Klik **"Review"** → **"Save policy"**

5. **Buat Policy 4: Allow Delete**
   - Klik **"New policy"**
   - Pilih **"Create a policy from scratch"**
   - **Policy name**: `Allow delete elections`
   - **Allowed operation**: Pilih **"DELETE"**
   - **Policy definition**:
     ```sql
     (bucket_id = 'elections')
     ```
   - Klik **"Review"** → **"Save policy"**

### LANGKAH 3: Verifikasi

1. **Cek Policies**
   - Di Storage → elections → Policies tab
   - Pastikan ada **4 policies** dan semuanya **AKTIF** (toggle ON):
     - ✅ "Public read elections" (SELECT)
     - ✅ "Allow upload elections" (INSERT) - **PENTING!**
     - ✅ "Allow update elections" (UPDATE)
     - ✅ "Allow delete elections" (DELETE)

2. **Test Upload Manual**
   - Di Storage → elections → Klik tombol **"Upload file"**
   - Upload file test
   - Pastikan file bisa diupload

### LANGKAH 4: Test di Aplikasi

1. **Refresh browser** (Ctrl+Shift+R)
2. Buka form tambah kandidat
3. Klik tombol **"Upload Foto"**
4. Pilih gambar
5. Upload seharusnya berhasil! ✅

---

## ✅ Checklist

- [ ] Bucket "elections" sudah dibuat
- [ ] Bucket bersifat **public** (centang saat create)
- [ ] Policy "Public read elections" (SELECT) sudah dibuat dan **AKTIF**
- [ ] Policy "Allow upload elections" (INSERT) sudah dibuat dan **AKTIF** ⚠️
- [ ] Policy "Allow update elections" (UPDATE) sudah dibuat dan **AKTIF**
- [ ] Policy "Allow delete elections" (DELETE) sudah dibuat dan **AKTIF**
- [ ] Semua policies statusnya **ON** (bukan OFF)
- [ ] Test upload manual berhasil di Dashboard
- [ ] Browser sudah di-refresh
- [ ] Test upload di aplikasi berhasil

---

## 🔍 Troubleshooting

### Masih Error "row-level security policy"?

**1. Cek Policy INSERT**
- Pastikan policy "Allow upload elections" ada
- Pastikan statusnya **AKTIF** (toggle ON, bukan OFF)
- Pastikan operation-nya **INSERT** (Upload)

**2. Cek Bucket Public**
- Pastikan bucket "elections" bersifat **public**
- Jika tidak public, edit bucket dan centang "Public bucket"

**3. Test Manual di Dashboard**
- Coba upload file langsung via Dashboard
- Jika bisa upload di Dashboard tapi tidak di aplikasi, masalahnya di kode
- Jika tidak bisa upload di Dashboard juga, masalahnya di policies

### Error: "bucket not found"

- Pastikan nama bucket tepat: `elections` (huruf kecil)
- Cek di Storage → List buckets

---

**Setup via Dashboard ini lebih mudah dan tidak perlu permission khusus!**

