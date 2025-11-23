# ⚡ Quick Setup Storage - via Dashboard

Karena ada permission error saat setup via SQL, gunakan Dashboard UI (lebih mudah!).

## 🚀 Langkah Cepat (3 menit)

### 1️⃣ Buat Bucket

1. Supabase Dashboard → **Storage**
2. Klik **"New bucket"**
3. Isi:
   - Name: `elections`
   - ✅ **Public bucket** (penting!)
4. Klik **"Create bucket"**

### 2️⃣ Setup Policies (4 policies)

Di Storage → elections → Tab **"Policies"** → Buat 4 policies:

**Policy 1: Read**
- New policy → Create from scratch
- Name: `Public read elections`
- Operation: **SELECT**
- Definition: `(bucket_id = 'elections')`

**Policy 2: Upload** ⚠️ **PENTING!**
- New policy → Create from scratch
- Name: `Allow upload elections`
- Operation: **INSERT**
- Definition: `(bucket_id = 'elections')`

**Policy 3: Update**
- New policy → Create from scratch
- Name: `Allow update elections`
- Operation: **UPDATE**
- Definition: `(bucket_id = 'elections')`

**Policy 4: Delete**
- New policy → Create from scratch
- Name: `Allow delete elections`
- Operation: **DELETE**
- Definition: `(bucket_id = 'elections')`

### 3️⃣ Aktifkan Semua Policies

Pastikan semua 4 policies statusnya **ON** (toggle di sebelah kanan).

### 4️⃣ Test

- Refresh browser
- Upload foto di form kandidat
- Seharusnya berhasil! ✅

---

**Setup via Dashboard tidak perlu permission khusus dan lebih mudah!**

Lihat `setup_storage_via_dashboard.md` untuk panduan lengkap dengan screenshot.

