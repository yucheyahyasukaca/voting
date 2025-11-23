# Cloudflare Pages Deployment Configuration

## ⚠️ PENTING: Konfigurasi di Cloudflare Pages Dashboard

### Build Settings:

1. **Build Command:**
   ```
   npm run build:cloudflare
   ```
   **JANGAN gunakan `npm run build`** - harus `build:cloudflare` untuk menjalankan `@cloudflare/next-on-pages`

2. **Build Output Directory:**
   ```
   .vercel/output/static
   ```

3. **Deploy Command:**
   **HAPUS atau KOSONGKAN deploy command** - Cloudflare Pages akan otomatis deploy setelah build.
   
   Atau jika memang diperlukan, gunakan:
   ```
   npx wrangler pages deploy .vercel/output/static --project-name=voting-app
   ```
   **PENTING:** Gunakan `wrangler pages deploy` bukan `wrangler deploy` (tanpa "pages")

## Environment Variables

Pastikan environment variables berikut di-set di Cloudflare Pages Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## File Konfigurasi

- `.npmrc` - Mengatur `legacy-peer-deps=true` untuk mengatasi peer dependency conflicts
- `wrangler.toml` - Konfigurasi Cloudflare Pages dengan output directory yang benar

## Troubleshooting

### Error: "It looks like you've run a Workers-specific command in a Pages project"
- **Solusi:** Hapus deploy command atau gunakan `wrangler pages deploy` bukan `wrangler deploy`

### Error: "Missing entry-point"
- **Solusi:** Pastikan build command menggunakan `npm run build:cloudflare` dan output directory adalah `.vercel/output/static`

## Catatan

- Build command akan menjalankan `next build` kemudian `@cloudflare/next-on-pages`
- Output akan berada di `.vercel/output/static`
- File `wrangler.toml` sudah dikonfigurasi untuk menggunakan output directory tersebut
- Pastikan environment variables sudah di-set di Cloudflare Pages dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`

## Troubleshooting

Jika deployment gagal dengan error "Missing entry-point", pastikan:
1. Build command berhasil dan menghasilkan output di `.vercel/output/static`
2. `wrangler.toml` sudah dikonfigurasi dengan benar
3. Deploy command menggunakan path yang benar ke output directory

