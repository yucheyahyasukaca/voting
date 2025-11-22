'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const electionId = searchParams.get('election')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-sm">DISDIKBUD</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 text-sm">Panitia Pemilihan</span>
          </div>
          <Link href="/admin" className="text-blue-600 text-sm">Butuh bantuan?</Link>
        </div>
      </div>

      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          {/* Success Icon - Sesuai Referensi */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-5xl">👍</span>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Berhasil!
          </h1>
          
          <p className="text-xl font-semibold text-gray-900 mb-4">
            Suara Anda telah tercatat.
          </p>
          
          <p className="text-gray-600 mb-8">
            Terima kasih telah berpartisipasi dalam pemilihan. Pantau update real-time tentang perkembangan pemilihan.
          </p>

          {electionId && (
            <Link
              href={`/voter/results?election=${electionId}`}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-4"
            >
              Lihat Hasil Live
            </Link>
          )}

          <p className="text-sm text-gray-500">
            Suara Anda bersifat rahasia dan tidak dapat diubah
          </p>
        </div>
      </div>
    </div>
  )
}
