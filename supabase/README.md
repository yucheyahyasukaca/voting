# Setup Database Supabase

## Langkah-langkah Setup

1. Login ke [Supabase Dashboard](https://app.supabase.com)

2. Buat project baru atau gunakan project yang sudah ada

3. Buka SQL Editor di dashboard Supabase

4. Copy dan paste seluruh isi file `schema.sql` ke SQL Editor

5. Jalankan query untuk membuat semua tabel dan fungsi

6. (Opsional) Setup Storage untuk upload gambar:
   - Buka Storage di sidebar
   - Buat bucket baru dengan nama `elections`
   - Set policy untuk public read:
     ```sql
     CREATE POLICY "Public Access" ON storage.objects
     FOR SELECT USING (bucket_id = 'elections');
     ```

7. (Opsional) Setup Authentication:
   - Buka Authentication di sidebar
   - Enable Email provider jika ingin menggunakan email login untuk admin

## Row Level Security (RLS)

Untuk keamanan yang lebih baik, disarankan untuk mengaktifkan RLS pada tabel-tabel penting:

```sql
-- Enable RLS
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;

-- Policies untuk public read (voting)
CREATE POLICY "Public read elections" ON elections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read candidates" ON candidates
  FOR SELECT USING (true);

-- Policies untuk insert votes (hanya dengan valid session)
CREATE POLICY "Public insert votes" ON votes
  FOR INSERT WITH CHECK (true);

-- Policies untuk admin (disesuaikan dengan auth system Anda)
-- CREATE POLICY "Admin all" ON elections
--   FOR ALL USING (auth.role() = 'admin');
```

