# 🔧 Update Deploy Command di Cloudflare Pages

## ⚡ Solusi Cepat: Gunakan Flag `--create`

Update Deploy command di Cloudflare Pages Dashboard menjadi:

```bash
npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create
```

### Langkah-langkah:

1. **Buka Cloudflare Pages Dashboard**
   - https://dash.cloudflare.com
   - Workers & Pages > Pages
   - Pilih project Anda

2. **Edit Settings**
   - Settings > Builds & deployments

3. **Update Deploy Command**
   - Field "Deploy command" → Update menjadi:
   ```
   npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create
   ```
   - **PENTING:** Tambahkan `--create` di akhir!

4. **Pastikan Konfigurasi Lain:**
   - ✅ Build command: `npm run build:cloudflare`
   - ✅ Build output directory: `.vercel/output/static`
   - ✅ Deploy command: `npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create`

5. **Save dan Retry Deployment**

---

## 🎯 Apa yang Dilakukan Flag `--create`?

- ✅ **Membuat project otomatis** jika belum ada dengan nama "voting-app"
- ✅ **Menggunakan project yang sudah ada** jika sudah dibuat sebelumnya
- ✅ **Mengatasi error "Project not found"**
- ✅ **Tidak perlu setup manual** di dashboard

---

## 📝 Alternatif: Update di `package.json`

Atau jika Anda ingin update di `package.json` juga:

```json
{
  "scripts": {
    "deploy": "npx wrangler pages deploy .vercel/output/static --project-name=voting-app --create"
  }
}
```

Tapi untuk automatic deployment di Cloudflare Pages, Deploy command di Dashboard lebih penting.

---

## ✅ Setelah Update

1. Klik **Save** di Cloudflare Pages Dashboard
2. Klik **Retry deployment** pada deployment yang gagal
3. Build akan berjalan dan deploy command akan membuat/menggunakan project "voting-app"

