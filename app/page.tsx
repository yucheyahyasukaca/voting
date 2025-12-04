'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { extractQRCode } from '@/lib/qrcode-utils'

declare global {
  interface Window {
    ZXing: any
  }
}

export default function HomePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [libraryLoaded, setLibraryLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanning, setScanning] = useState(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load ZXing library from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.ZXing) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@zxing/library@latest'
      script.async = true
      script.onload = () => {
        setLibraryLoaded(true)
      }
      script.onerror = () => {
        setError('Gagal memuat library scanner. Silakan gunakan upload gambar.')
      }
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    } else if (window.ZXing) {
      setLibraryLoaded(true)
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!libraryLoaded) {
      setError('Library scanner sedang dimuat. Silakan tunggu sebentar.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const BrowserMultiFormatReader = window.ZXing.BrowserMultiFormatReader
      const reader = new BrowserMultiFormatReader()
      const imageUrl = URL.createObjectURL(file)
      
      const result = await reader.decodeFromImageUrl(imageUrl)
      
      if (result) {
        const decodedText = result.getText()
        const qrCode = extractQRCode(decodedText)
        
        router.push(`/voter?qrcode=${encodeURIComponent(qrCode)}`)
      }
      
      URL.revokeObjectURL(imageUrl)
    } catch (err: any) {
      setError('Gagal membaca QR code dari gambar. Pastikan gambar QR code jelas dan tidak blur.')
      console.error('Error decoding QR code:', err)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const startCameraScan = async () => {
    if (!libraryLoaded) {
      setError('Library scanner sedang dimuat. Silakan tunggu sebentar.')
      return
    }

    setError(null)
    setScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        startQRScanning()
      }
    } catch (err: any) {
      setError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.')
      console.error('Error accessing camera:', err)
      setScanning(false)
    }
  }

  const startQRScanning = () => {
    if (!libraryLoaded || !videoRef.current || !canvasRef.current) return

    const BrowserMultiFormatReader = window.ZXing.BrowserMultiFormatReader
    const reader = new BrowserMultiFormatReader()
    
    scanIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        
        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          try {
            canvas.toBlob(async (blob) => {
              if (!blob) return
              
              const imageUrl = URL.createObjectURL(blob)
              try {
                const result = await reader.decodeFromImageUrl(imageUrl)
                URL.revokeObjectURL(imageUrl)
                
                if (result) {
                  const decodedText = result.getText()
                  const qrCode = extractQRCode(decodedText)
                  
                  if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current)
                    scanIntervalRef.current = null
                  }
                  stopScanning()
                  router.push(`/voter?qrcode=${encodeURIComponent(qrCode)}`)
                }
              } catch (err) {
                URL.revokeObjectURL(imageUrl)
                // QR code tidak ditemukan, lanjutkan scanning
              }
            }, 'image/png')
          } catch (err) {
            // Error saat capture, lanjutkan scanning
          }
        }
      }
    }, 500)
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col items-center justify-center px-4">
      {!scanning ? (
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Selamat Datang!</h1>
            <p className="text-gray-400 text-lg">
              Siap untuk memberikan suara anda?
            </p>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!libraryLoaded && (
            <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg mb-4">
              Memuat library scanner...
            </div>
          )}

          <button
            onClick={startCameraScan}
            disabled={loading || !libraryLoaded}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl mb-4"
          >
            {loading ? 'Memuat...' : 'Mulai Scan QR Code'}
          </button>
          
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={loading || !libraryLoaded}
              className="hidden"
              id="qr-file-input"
            />
            <label
              htmlFor="qr-file-input"
              className={`w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium py-4 px-8 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl cursor-pointer inline-block text-center ${loading || !libraryLoaded ? 'opacity-50' : ''}`}
            >
              {loading ? 'Memuat...' : 'Upload Gambar QR Code'}
            </label>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Arahkan kamera ke QR code atau upload gambar QR code
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
            <p className="text-gray-400">Arahkan kamera ke QR code</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="relative w-full rounded-lg overflow-hidden bg-black mb-4">
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
              autoPlay
            ></video>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500 rounded-lg"></div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>

          <button
            onClick={stopScanning}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  )
}
