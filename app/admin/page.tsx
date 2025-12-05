'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { isAuthenticated } from '@/lib/auth'
import AdminLayout from '@/components/AdminLayout'

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
  const [editTimeModal, setEditTimeModal] = useState<{ show: boolean; election: Election | null }>({
    show: false,
    election: null,
  })
  const [editTimeData, setEditTimeData] = useState({
    start_date: '',
    end_date: '',
  })
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      router.push('/login')
      return
    }
    loadElections()
  }

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

  const openEditTimeModal = (election: Election) => {
    setEditTimeModal({ show: true, election })
    // Format dates for datetime-local input
    const startDate = new Date(election.start_date)
    const endDate = new Date(election.end_date)
    
    setEditTimeData({
      start_date: formatDateTimeLocal(startDate),
      end_date: formatDateTimeLocal(endDate),
    })
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleUpdateTime = async () => {
    if (!editTimeModal.election) return

    // Validation
    if (!editTimeData.start_date || !editTimeData.end_date) {
      alert('Mohon isi semua waktu')
      return
    }

    const startDate = new Date(editTimeData.start_date)
    const endDate = new Date(editTimeData.end_date)

    if (endDate <= startDate) {
      alert('Waktu berakhir harus setelah waktu mulai')
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('elections')
        .update({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', editTimeModal.election.id)

      if (error) {
        console.error('Error updating election time:', error)
        alert('Gagal mengubah waktu pemilihan: ' + error.message)
        return
      }

      // Close modal and reload
      setEditTimeModal({ show: false, election: null })
      loadElections()
    } catch (err: any) {
      console.error('Error:', err)
      alert('Terjadi kesalahan: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Memuat dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const activeElections = elections.filter(e => e.is_active).length
  const inactiveElections = elections.filter(e => !e.is_active).length

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Selamat Datang di Dashboard Admin 👋
        </h1>
        <p className="text-gray-600">Kelola pemilihan Anda dengan mudah dan efisien</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 border border-blue-100 transform hover:scale-105 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Pemilihan</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{elections.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 border border-green-100 transform hover:scale-105 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Pemilihan Aktif</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{activeElections}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 border border-orange-100 transform hover:scale-105 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Tidak Aktif</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{inactiveElections}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href="/admin/elections/new"
          className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Pemilihan Baru
        </Link>
      </div>

      {/* Elections List */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900">Daftar Pemilihan</h2>
          <p className="text-gray-600 text-sm mt-1">Kelola dan pantau semua pemilihan Anda</p>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Belum ada pemilihan</p>
            <p className="text-gray-600 mb-6">Mulai dengan membuat pemilihan pertama Anda</p>
            <Link
              href="/admin/elections/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Pemilihan Pertama
            </Link>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {elections.map((election) => (
                <div
                  key={election.id}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-2xl transition-all border border-gray-200 hover:border-blue-300 overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                        {election.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ml-2 flex-shrink-0 ${
                          election.is_active
                            ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {election.is_active ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </div>

                    {election.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {election.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(election.start_date)}</span>
                        </div>
                        <button
                          onClick={() => openEditTimeModal(election)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit waktu"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(election.end_date)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href={`/admin/elections/${election.id}`}
                        className="block w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-center text-sm font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        Kelola Pemilihan
                      </Link>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleElectionStatus(election.id, election.is_active)}
                          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            election.is_active
                              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          }`}
                        >
                          {election.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, election })}
                          className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium border border-red-200 transition-all"
                          title="Hapus pemilihan"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Time Modal */}
      {editTimeModal.show && editTimeModal.election && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-scaleIn">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Edit Waktu Pemilihan
                </h2>
                <p className="text-gray-600 text-sm">
                  {editTimeModal.election.title}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Mulai
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    value={editTimeData.start_date}
                    onChange={(e) => setEditTimeData({ ...editTimeData, start_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waktu Berakhir
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="datetime-local"
                    value={editTimeData.end_date}
                    onChange={(e) => setEditTimeData({ ...editTimeData, end_date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pastikan waktu yang dimasukkan sudah benar. Waktu berakhir harus setelah waktu mulai.</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditTimeModal({ show: false, election: null })}
                disabled={updating}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateTime}
                disabled={updating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                {updating ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.election && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-scaleIn">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Hapus Pemilihan?
                </h2>
                <p className="text-gray-600 text-sm">
                  {deleteModal.election.title}
                </p>
              </div>
            </div>
            
            <div className="mb-4 space-y-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mulai: {formatDate(deleteModal.election.start_date)}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Berakhir: {formatDate(deleteModal.election.end_date)}
              </p>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800 font-semibold mb-2">
                ⚠️ Perhatian! Tindakan ini tidak dapat dibatalkan!
              </p>
              <p className="text-sm text-red-700 mb-2">
                Menghapus pemilihan ini akan menghapus <strong>semua data terkait</strong>:
              </p>
              <ul className="ml-4 text-sm text-red-700 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Semua kategori
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Semua kandidat
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Semua suara (votes)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Semua QR codes
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, election: null })}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteElection}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

