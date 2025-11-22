'use client'

import { useEffect, useState } from 'react'

export default function ResetDataPage() {
  const [reset, setReset] = useState(false)

  useEffect(() => {
    if (reset) {
      // Clear all localStorage data
      localStorage.removeItem('mock_elections')
      localStorage.removeItem('mock_candidates')
      localStorage.removeItem('mock_votes')
      localStorage.removeItem('mock_sessions')
      
      // Reload page
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }
  }, [reset])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Reset Data Mock
        </h1>
        <p className="text-gray-600 mb-6">
          Halaman ini akan menghapus semua data di localStorage dan memuat ulang dengan data baru.
        </p>
        {!reset ? (
          <button
            onClick={() => setReset(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Reset Data
          </button>
        ) : (
          <div>
            <p className="text-green-600 mb-4">Data berhasil direset!</p>
            <p className="text-sm text-gray-500">Mengalihkan ke halaman utama...</p>
          </div>
        )}
      </div>
    </div>
  )
}

