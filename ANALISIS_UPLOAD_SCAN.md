# Analisis Model Upload vs Scan - ID Voter

## Kesimpulan
✅ **Keduanya mengacu ke ID voter yang SAMA**

## Perbandingan Detail

### 1. Upload Model (`handleFileUpload`)
**Lokasi**: `app/page.tsx` baris 46-96

**Alur:**
1. User upload gambar QR code
2. Decode QR code menggunakan ZXing library
3. Extract QR code dengan logika:
   ```javascript
   // Baris 66-81
   let qrCode = decodedText
   if (decodedText.includes('qrcode=')) {
     // Extract dari URL parameter
     qrCode = url.searchParams.get('qrcode') || ...
   } else if (decodedText.includes('/voter')) {
     // Extract menggunakan regex
     qrCode = match ? match[1] : decodedText
   }
   ```
4. Redirect ke: `/voter?qrcode=${qrCode}`

### 2. Scan Model (`startQRScanning`)
**Lokasi**: `app/page.tsx` baris 131-192

**Alur:**
1. User scan QR code dengan kamera
2. Capture frame dari video stream
3. Decode QR code menggunakan ZXing library
4. Extract QR code dengan logika: **SAMA PERSIS** dengan upload
   ```javascript
   // Baris 158-172 - LOGIKA SAMA PERSIS
   let qrCode = decodedText
   if (decodedText.includes('qrcode=')) {
     // Extract dari URL parameter
     qrCode = url.searchParams.get('qrcode') || ...
   } else if (decodedText.includes('/voter')) {
     // Extract menggunakan regex
     qrCode = match ? match[1] : decodedText
   }
   ```
5. Redirect ke: `/voter?qrcode=${qrCode}`

### 3. Penggunaan QR Code sebagai Voter ID

QR code yang di-extract kemudian digunakan sebagai `voter_token` di berbagai tempat:

1. **`app/voter/page.tsx`** (baris 95):
   - Query `voting_sessions` dengan `qr_code = qrCode`
   
2. **`app/voter/vote/page.tsx`** (baris 113):
   - `const voterToken = qrCode!`
   - Digunakan untuk menyimpan vote dengan `voter_token: voterToken`

3. **`app/voter/success/page.tsx`** (baris 46):
   - QR code digunakan sebagai `token` untuk tracking voting progress

4. **Database Schema**:
   - `voting_sessions.qr_code` → QR code unik per session
   - `votes.voter_token` → QR code digunakan sebagai voter identifier

## Hasil Verifikasi

✅ **Keduanya menggunakan logika extract yang IDENTIK**
✅ **Keduanya menghasilkan QR code yang sama untuk QR code input yang sama**
✅ **Keduanya redirect ke URL yang sama dengan format yang sama**
✅ **QR code tersebut digunakan sebagai voter_token yang sama di seluruh aplikasi**

## Rekomendasi

Karena logika extract QR code duplikat, disarankan untuk:
1. Membuat helper function `extractQRCode(decodedText)` untuk menghindari duplikasi
2. Ini akan memudahkan maintenance dan memastikan konsistensi

## Contoh Helper Function

```typescript
function extractQRCode(decodedText: string): string {
  let qrCode = decodedText
  
  if (decodedText.includes('qrcode=')) {
    try {
      const url = new URL(decodedText)
      qrCode = url.searchParams.get('qrcode') || decodedText.split('qrcode=')[1]?.split('&')[0] || decodedText
    } catch {
      const match = decodedText.match(/qrcode=([^&]+)/)
      qrCode = match ? match[1] : decodedText
    }
  } else if (decodedText.includes('/voter')) {
    const match = decodedText.match(/qrcode=([^&]+)/)
    qrCode = match ? match[1] : decodedText
  }
  
  return qrCode
}
```

