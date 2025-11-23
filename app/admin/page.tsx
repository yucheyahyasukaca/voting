'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Election {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadElections()
  }, [])

  const loadElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading elections:', error)
        return
      }

      setElections(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleElectionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('elections')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) {
        alert('Gagal mengubah status pemilihan')
        return
      }

      loadElections()
    } catch (err) {
      alert('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <Link
            href="/admin/elections/new"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Buat Pemilihan Baru
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg mb-4">Belum ada pemilihan</p>
              <Link
                href="/admin/elections/new"
                className="text-blue-600 hover:underline"
              >
                Buat pemilihan pertama
              </Link>
            </div>
          ) : (
            elections.map((election) => (
              <div
                key={election.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{election.title}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      election.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {election.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>

                {election.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {election.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <p>Mulai: {formatDate(election.start_date)}</p>
                  <p>Berakhir: {formatDate(election.end_date)}</p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/elections/${election.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                  >
                    Kelola
                  </Link>
                  <button
                    onClick={() => toggleElectionStatus(election.id, election.is_active)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      election.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {election.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

