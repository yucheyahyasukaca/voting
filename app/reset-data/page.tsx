'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetDataPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA data di database (votes, voting_sessions, categories, candidates, elections). Apakah Anda yakin?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Delete in order due to foreign key constraints
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (votesError) throw votesError

      const { error: sessionsError } = await supabase
        .from('voting_sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (sessionsError) throw sessionsError

      const { error: categoriesError } = await supabase
        .from('categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (categoriesError) throw categoriesError

      const { error: candidatesError } = await supabase
        .from('candidates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (candidatesError) throw candidatesError

      const { error: electionsError } = await supabase
        .from('elections')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (electionsError) throw electionsError

      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/admin'
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat reset data')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Reset Database
          </h1>
          <p className="text-gray-600 mb-4">
            Halaman ini akan menghapus <strong>SEMUA DATA</strong> di database Supabase:
          </p>
          <ul className="text-left text-gray-600 mb-4 space-y-1">
            <li>• Semua data votes (suara)</li>
            <li>• Semua voting sessions (QR codes)</li>
            <li>• Semua categories</li>
            <li>• Semua candidates</li>
            <li>• Semua elections</li>
          </ul>
          <p className="text-red-600 font-semibold">
            ⚠️ Aksi ini tidak dapat dibatalkan!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <p className="font-semibold">✅ Data berhasil direset!</p>
              <p className="text-sm mt-2">Mengalihkan ke halaman admin...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Menghapus Data...' : '🗑️ Reset Database'}
            </button>
            
            <Link
              href="/admin"
              className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              ← Batal & Kembali
            </Link>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Untuk reset data, Anda bisa juga menggunakan SQL Editor di Supabase Dashboard
        </p>
      </div>
    </div>
  )
}

