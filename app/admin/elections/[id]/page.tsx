'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from '@/components/QRCode'

interface Election {
  id: string
  title: string
  description: string
  hero_banner_url: string | null
  start_date: string
  end_date: string
  is_active: boolean
  allow_view_results: boolean
}

interface Candidate {
  id: string
  name: string
  description: string
  photo_url: string | null
  order_index: number
}

interface VotingSession {
  id: string
  qr_code: string
  is_active: boolean
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  order_index: number
  is_active: boolean
}

export default function ElectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string

  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'candidates' | 'qr' | 'results'>('categories')
  const [qrCount, setQrCount] = useState(1)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [electionId])

  const loadData = async () => {
    try {
      // Load election
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single()

      if (electionError || !electionData) {
        alert('Pemilihan tidak ditemukan')
        router.push('/admin')
        return
      }

      setElection(electionData)

      // Load candidates
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true })

      setCandidates(candidatesData || [])

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true })

      setCategories(categoriesData || [])

      // Load voting sessions (all active)
      const { data: sessionsData } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('election_id', electionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (sessionsData && sessionsData.length > 0) {
        setVotingSessions(sessionsData)
        setVotingSession(sessionsData[0]) // Set first one as default for backward compatibility
      } else {
        setVotingSessions([])
        setVotingSession(null)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (qrCount < 1 || qrCount > 1000) {
      alert('Jumlah QR code harus antara 1-1000')
      return
    }

    setGenerating(true)
    try {
      // Generate multiple QR codes
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const sessionsToInsert = []

      for (let i = 0; i < qrCount; i++) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const qrCode = `voting-${electionId}-${timestamp}-${random}`
        
        sessionsToInsert.push({
          election_id: electionId,
          qr_code: qrCode,
          is_active: true,
        })
      }

      // Insert all sessions at once
      const { data, error } = await supabase
        .from('voting_sessions')
        .insert(sessionsToInsert)
        .select()

      if (error) {
        alert('Gagal membuat QR codes: ' + error.message)
        setGenerating(false)
        return
      }

      // Reload data to show all QR codes
      await loadData()
      setActiveTab('qr')
      alert(`Berhasil membuat ${qrCount} QR code!`)
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || 'Unknown error'))
    } finally {
      setGenerating(false)
    }
  }

  const deactivateAllSessions = async () => {
    if (!confirm('Yakin ingin menonaktifkan semua QR code? QR code yang dinonaktifkan tidak bisa digunakan untuk voting.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('voting_sessions')
        .update({ is_active: false })
        .eq('election_id', electionId)

      if (error) {
        alert('Gagal menonaktifkan QR codes: ' + error.message)
        return
      }

      await loadData()
      alert('Semua QR code berhasil dinonaktifkan')
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || 'Unknown error'))
    }
  }

  const deleteCandidate = async (candidateId: string) => {
    if (!confirm('Yakin ingin menghapus kandidat ini?')) return

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) {
        alert('Gagal menghapus kandidat')
        return
      }

      loadData()
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

  if (!election) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const votingUrl = votingSession
    ? `${appUrl}/voter?qrcode=${votingSession.qr_code}`
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Kembali ke Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{election.title}</h1>
          {election.description && (
            <p className="text-gray-600 mb-4">{election.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                election.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {election.is_active ? 'Aktif' : 'Tidak Aktif'}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                election.allow_view_results
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {election.allow_view_results ? 'Hasil Live: Diizinkan' : 'Hasil Live: Diblokir'}
            </span>
            {election.hero_banner_url && (
              <div className="relative w-32 h-20 rounded overflow-hidden">
                <Image
                  src={election.hero_banner_url}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          
          {/* Toggle Allow View Results */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Izinkan Melihat Hasil Live</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Jika diaktifkan, voter dapat melihat hasil voting secara real-time. Jika dinonaktifkan, voter akan melihat pesan bahwa hasil belum diizinkan untuk dilihat.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const newValue = !election.allow_view_results
                    
                    // Update state immediately for better UX
                    setElection({ ...election, allow_view_results: newValue })
                    
                    const { data, error } = await supabase
                      .from('elections')
                      .update({ allow_view_results: newValue })
                      .eq('id', electionId)
                      .select()
                      .single()

                    if (error) {
                      // Revert state on error
                      setElection({ ...election, allow_view_results: !newValue })
                      console.error('Error updating election:', error)
                      alert('Gagal mengubah pengaturan: ' + (error.message || 'Unknown error'))
                      return
                    }

                    // Update with server response
                    if (data) {
                      setElection(data)
                    } else {
                      // Reload data to ensure sync
                      loadData()
                    }
                  } catch (err: any) {
                    // Revert state on error
                    setElection({ ...election, allow_view_results: election.allow_view_results })
                    console.error('Error updating election:', err)
                    alert('Terjadi kesalahan: ' + (err.message || 'Unknown error'))
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  election.allow_view_results ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    election.allow_view_results ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'categories'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Kategori
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'candidates'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Kandidat
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'qr'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                QR Code
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'results'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Hasil Voting
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Daftar Kategori</h2>
                  <Link
                    href={`/admin/elections/${electionId}/categories/new`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Tambah Kategori
                  </Link>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">Belum ada kategori</p>
                    <Link
                      href={`/admin/elections/${electionId}/categories/new`}
                      className="text-blue-600 hover:underline"
                    >
                      Tambah kategori pertama
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {category.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link
                            href={`/admin/elections/${electionId}/categories/${category.id}`}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm('Yakin ingin menghapus kategori ini?')) return
                              try {
                                const { error } = await supabase
                                  .from('categories')
                                  .delete()
                                  .eq('id', category.id)
                                if (error) {
                                  alert('Gagal menghapus kategori')
                                  return
                                }
                                loadData()
                              } catch (err) {
                                alert('Terjadi kesalahan')
                              }
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'candidates' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Daftar Kandidat</h2>
                  <Link
                    href={`/admin/elections/${electionId}/candidates/new`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Tambah Kandidat
                  </Link>
                </div>

                {candidates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">Belum ada kandidat</p>
                    <Link
                      href={`/admin/elections/${electionId}/candidates/new`}
                      className="text-blue-600 hover:underline"
                    >
                      Tambah kandidat pertama
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {candidate.photo_url ? (
                            <Image
                              src={candidate.photo_url}
                              alt={candidate.name}
                              width={60}
                              height={60}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                              👤
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {candidate.name}
                            </h3>
                            {candidate.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {candidate.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/elections/${electionId}/candidates/${candidate.id}`}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-center text-sm font-medium hover:bg-blue-700"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteCandidate(candidate.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qr' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">QR Code untuk Voting</h2>
                  {votingSessions.length > 0 && (
                    <button
                      onClick={deactivateAllSessions}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                    >
                      Nonaktifkan Semua QR Code
                    </button>
                  )}
                </div>

                {/* Generate QR Codes Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate QR Code Baru</h3>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah QR Code (1 QR Code = 1 Peserta)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={qrCount}
                        onChange={(e) => setQrCount(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                        placeholder="Jumlah peserta"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Generate QR code sesuai jumlah peserta yang akan hadir di acara
                      </p>
                    </div>
                    <button
                      onClick={generateQRCode}
                      disabled={generating || qrCount < 1 || qrCount > 1000}
                      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium ${
                        generating || qrCount < 1 || qrCount > 1000
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {generating ? 'Membuat...' : `Generate ${qrCount} QR Code`}
                    </button>
                  </div>
                </div>

                {/* List of QR Codes */}
                {votingSessions.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-semibold">{votingSessions.length}</span> QR code aktif
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {votingSessions.map((session, index) => {
                        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                        const sessionUrl = `${appUrl}/voter?qrcode=${session.qr_code}`
                        return (
                          <div
                            key={session.id}
                            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                          >
                            <div className="flex flex-col items-center space-y-4">
                              <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                                <QRCode value={sessionUrl} size={150} />
                              </div>
                              <div className="w-full text-center">
                                <p className="text-xs text-gray-500 mb-1">QR Code #{index + 1}</p>
                                <p className="text-xs text-gray-400 break-all bg-gray-50 p-2 rounded">
                                  {session.qr_code.substring(0, 30)}...
                                </p>
                                <a
                                  href={sessionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                  Buka Link
                                </a>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600 mb-4">
                      Belum ada QR code yang aktif. Generate QR code untuk memulai voting.
                    </p>
                    <p className="text-sm text-gray-500">
                      1 QR Code = 1 Peserta. Pastikan jumlah QR code sesuai dengan jumlah peserta yang akan hadir.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Hasil Voting</h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link
                    href={`/admin/elections/${electionId}/results`}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center"
                  >
                    Lihat Hasil (Admin)
                  </Link>
                  <Link
                    href={`/voter/results?election=${electionId}`}
                    target="_blank"
                    className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
                  >
                    Lihat Halaman Public
                  </Link>
                </div>
                <p className="text-gray-600">
                  Gunakan tombol di atas untuk melihat hasil voting. Halaman admin untuk monitoring, halaman public untuk ditampilkan ke publik.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

