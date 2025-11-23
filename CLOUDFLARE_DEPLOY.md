# Cloudflare Pages Deployment Configuration

## Build Settings

Untuk deployment di Cloudflare Pages, gunakan konfigurasi berikut:

### Build Command:
```bash
npm run build:cloudflare
```

**PENTING:** Gunakan `build:cloudflare` bukan `build` karena ini akan menjalankan `@cloudflare/next-on-pages` setelah build Next.js.

### Build Output Directory:
```
.vercel/output/static
```

### Deploy Command (jika diperlukan):
```bash
npx wrangler pages deploy .vercel/output/static --project-name=voting-app
```

## File Konfigurasi

- `.npmrc` - Mengatur `legacy-peer-deps=true` untuk mengatasi peer dependency conflicts
- `wrangler.toml` - Konfigurasi Cloudflare Pages dengan output directory yang benar

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

