# 🔧 Perbaiki Error "column category_id does not exist"

Error ini muncul karena tabel `votes` sudah ada tapi tidak memiliki kolom `category_id`.

## ✅ Solusi

Ada 2 opsi:

### OPSI 1: Perbaiki Struktur Tabel (AMAN - Tidak Hapus Data)

Jalankan script `repair_votes_table.sql` yang akan:
- Tambahkan kolom `category_id` jika belum ada
- Perbaiki constraint UNIQUE
- Buat index yang diperlukan

**Langkah:**
1. Buka Supabase Dashboard → SQL Editor → New query
2. Copy seluruh isi file `repair_votes_table.sql`
3. Paste dan Run

### OPSI 2: Recreate Tabel (HAPUS DATA - Hanya jika data votes tidak penting)

Jika data votes tidak penting, gunakan file `fix_schema.sql` yang sudah diupdate.
File ini akan:
- Drop tabel `votes` (menghapus semua data!)
- Recreate dengan struktur yang benar

**PERINGATAN:** Opsi ini akan menghapus semua data votes yang sudah ada!

---

## 🎯 Rekomendasi

**Gunakan OPSI 1** jika sudah ada data votes yang penting.

**Gunakan OPSI 2** jika ini baru setup dan belum ada data penting.

---

## 📝 Setelah Perbaikan

1. Refresh browser (Ctrl+Shift+R)
2. Cek apakah error 404/406 sudah hilang
3. Test aplikasi dengan membuat pemilihan baru

