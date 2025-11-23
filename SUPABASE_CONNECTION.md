# Status Koneksi Database

## ✅ Aplikasi Menggunakan Supabase Database

Semua data pemilihan **TERSIMPAN DI DATABASE SUPABASE** (PostgreSQL).

### Status Saat Ini:
- ✅ **Semua komponen menggunakan Supabase asli**
- ✅ **Mock data sudah dihapus**
- ✅ **Data tersimpan permanen di database**

### File yang Digunakan:
```typescript
// Semua komponen menggunakan:
import { supabase } from '@/lib/supabase'
```

### Tabel Database:
- `elections` - Data pemilihan
- `candidates` - Data kandidat  
- `categories` - Kategori pemilihan (opsional)
- `votes` - Data suara pemilih
- `voting_sessions` - Sesi QR code untuk voting

### Environment Variables:
File `.env.local` berisi credentials Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Keuntungan Menggunakan Supabase:

✅ **Data Permanen**: Data tidak hilang saat browser ditutup  
✅ **Multi-Device**: Dapat diakses dari berbagai device  
✅ **Real-time**: Update otomatis saat ada perubahan  
✅ **Scalable**: Bisa menangani banyak user bersamaan  
✅ **Backup**: Data ter-backup otomatis oleh Supabase  

## Cara Reset Data (Jika Diperlukan):

Jika ingin reset semua data voting:

1. Buka Supabase Dashboard
2. Masuk ke SQL Editor
3. Jalankan query:
```sql
-- Hapus semua votes
DELETE FROM votes;

-- Hapus semua voting sessions
DELETE FROM voting_sessions;

-- Hapus semua categories (opsional)
DELETE FROM categories;

-- Hapus semua candidates (opsional)
DELETE FROM candidates;

-- Hapus semua elections (opsional)
DELETE FROM elections;
```

Atau gunakan halaman `/reset-data` di aplikasi (jika tersedia).

