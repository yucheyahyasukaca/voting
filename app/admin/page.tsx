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
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; election: Election | null }>({
    show: false,
    election: null,
  })
  const [deleting, setDeleting] = useState(false)

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

  const handleDeleteElection = async () => {
    if (!deleteModal.election) return

    setDeleting(true)
    try {
      // Delete election (cascade will handle related data)
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', deleteModal.election.id)

      if (error) {
        console.error('Error deleting election:', error)
        alert('Gagal menghapus pemilihan: ' + error.message)
        return
      }

      // Close modal and reload
      setDeleteModal({ show: false, election: null })
      loadElections()
    } catch (err: any) {
      console.error('Error:', err)
      alert('Terjadi kesalahan: ' + err.message)
    } finally {
      setDeleting(false)
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

                <div className="space-y-2">
                  <Link
                    href={`/admin/elections/${election.id}`}
                    className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                  >
                    Kelola
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleElectionStatus(election.id, election.is_active)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                        election.is_active
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {election.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, election })}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      title="Hapus pemilihan"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.election && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {deleteModal.election.title}
            </h2>
            
            <div className="mb-4 space-y-1">
              <p className="text-sm text-gray-600">
                Mulai: {formatDate(deleteModal.election.start_date)}
              </p>
              <p className="text-sm text-gray-600">
                Berakhir: {formatDate(deleteModal.election.end_date)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Perhatian!</strong> Menghapus pemilihan ini akan menghapus <strong>semua data terkait</strong> termasuk:
              </p>
              <ul className="mt-2 ml-4 text-sm text-red-700 list-disc">
                <li>Semua kategori</li>
                <li>Semua kandidat</li>
                <li>Semua suara (votes)</li>
                <li>Semua QR codes</li>
              </ul>
              <p className="mt-2 text-sm text-red-800 font-semibold">
                Tindakan ini tidak dapat dibatalkan!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteElection}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, election: null })}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

