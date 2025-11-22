'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-mock'
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

export default function ElectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string

  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'candidates' | 'qr' | 'results'>('candidates')

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

      // Load voting session
      const { data: sessionData } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('election_id', electionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setVotingSession(sessionData || null)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    try {
      // Deactivate existing sessions
      await supabase
        .from('voting_sessions')
        .update({ is_active: false })
        .eq('election_id', electionId)

      // Generate new QR code
      const qrCode = `voting-${electionId}-${Date.now()}`
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const votingUrl = `${appUrl}/voter?qrcode=${qrCode}`

      // Create new session
      const { data, error } = await supabase
        .from('voting_sessions')
        .insert({
          election_id: electionId,
          qr_code: qrCode,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        alert('Gagal membuat QR code: ' + error.message)
        return
      }

      setVotingSession(data)
      setActiveTab('qr')
    } catch (err) {
      alert('Terjadi kesalahan')
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
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                election.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {election.is_active ? 'Aktif' : 'Tidak Aktif'}
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
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
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
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-6">QR Code untuk Voting</h2>
                
                {votingSession ? (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <QRCode value={votingUrl} size={256} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">URL Voting:</p>
                      <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded">
                        {votingUrl}
                      </p>
                    </div>
                    <button
                      onClick={generateQRCode}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Generate QR Code Baru
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-6">
                      Belum ada QR code yang aktif. Generate QR code untuk memulai voting.
                    </p>
                    <button
                      onClick={generateQRCode}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Generate QR Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Hasil Voting</h2>
                <Link
                  href={`/voter/results?election=${electionId}`}
                  target="_blank"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-6"
                >
                  Lihat Hasil Live
                </Link>
                <p className="text-gray-600">
                  Klik tombol di atas untuk melihat hasil voting secara real-time
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

