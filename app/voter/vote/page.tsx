'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase-mock'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Candidate {
  id: string
  name: string
  description: string
  photo_url: string | null
}

function VotePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrCode = searchParams.get('qrcode')
  const candidateId = searchParams.get('candidate')
  
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!candidateId || !qrCode) {
      setError('Parameter tidak valid')
      setLoading(false)
      return
    }

    loadCandidate()
  }, [candidateId, qrCode])

  const loadCandidate = async () => {
    try {
      const { data, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId!)
        .single()

      if (candidateError || !data) {
        setError('Kandidat tidak ditemukan')
        setLoading(false)
        return
      }

      setCandidate(data)
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    if (!candidate || !qrCode) return

    setSubmitting(true)
    setError(null)

    try {
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('election_id')
        .eq('qr_code', qrCode)
        .single()

      if (sessionError || !session) {
        setError('Sesi voting tidak valid')
        setSubmitting(false)
        return
      }

      const voterToken = qrCode

      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('election_id', session.election_id)
        .eq('voter_token', voterToken)
        .single()

      if (existingVote) {
        setError('QR Code ini sudah digunakan untuk memberikan suara')
        setSubmitting(false)
        return
      }

      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          election_id: session.election_id,
          candidate_id: candidate.id,
          voter_token: voterToken,
        })

      if (voteError) {
        if (voteError.code === '23505') {
          setError('QR Code ini sudah digunakan untuk memberikan suara')
        } else {
          setError('Gagal memberikan suara. Silakan coba lagi.')
        }
        setSubmitting(false)
        return
      }

      router.push(`/voter/success?election=${session.election_id}`)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (error && !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  if (!candidate) return null

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Saatnya memberikan suara Anda!
        </h1>
        <p className="text-gray-600 mb-6">
          Pilih dua kandidat teratas yang akan mewakili Anda di DISDIKBUD Panitia Pemilihan.
        </p>

        {/* Candidate Card - Sesuai Referensi */}
        <div 
          className={`bg-white border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all ${
            showConfirm ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => setShowConfirm(true)}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {candidate.photo_url ? (
                <Image
                  src={candidate.photo_url}
                  alt={candidate.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl">
                  👤
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {candidate.name}
              </h3>
              {candidate.description && (
                <p className="text-gray-600 text-sm">{candidate.description}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {showConfirm ? (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              ) : (
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
          </div>
        </div>

        {/* Security Message */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>🔒</span>
          <span>Suara Anda bersifat rahasia dan aman.</span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all"
        >
          Next
        </button>
      </div>

      {/* Confirmation Modal - Sesuai Referensi */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi pilihan Anda!</h2>
            <p className="text-gray-600 mb-6">
              Tinjau pilihan Anda dan ketuk 'Konfirmasi Suara' untuk memberikan suara.
            </p>

            {/* Selected Candidate */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {candidate.photo_url ? (
                  <Image
                    src={candidate.photo_url}
                    alt={candidate.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <p className="text-center font-semibold text-gray-900">{candidate.name}</p>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleVote}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg mb-3 transition-all disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Confirm Vote'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full text-blue-600 hover:underline py-2"
            >
              Ubah Pilihan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <VotePageContent />
    </Suspense>
  )
}
