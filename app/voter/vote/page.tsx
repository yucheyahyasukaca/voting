'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeQRCode } from '@/lib/qrcode-utils'

interface Candidate {
  id: string
  name: string
  description: string
  photo_url: string | null
}

interface Election {
  id: string
  title: string
}

interface Category {
  id: string
  name: string
}

function VotePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrCodeRaw = searchParams.get('qrcode')
  const qrCode = qrCodeRaw ? normalizeQRCode(qrCodeRaw) : null
  const categoryId = searchParams.get('category')

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [hasExistingVotes, setHasExistingVotes] = useState(false)
  const [existingVoteIds, setExistingVoteIds] = useState<string[]>([])
  const [nextCategory, setNextCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (!qrCode || !categoryId) {
      setError('Parameter tidak valid')
      setLoading(false)
      return
    }

    loadElectionData()
  }, [qrCode, categoryId])

  const loadElectionData = async () => {
    // Reset state for new category load
    setLoading(true)
    setHasExistingVotes(false)
    setExistingVoteIds([])
    setSelectedCandidates([])
    setNextCategory(null)
    setError(null)
    setShowConfirm(false)
    setSubmitting(false)

    try {
      // Get session with qr_code to ensure we use the exact value from database
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('election_id, qr_code')
        .eq('qr_code', qrCode!)
        .single()

      if (sessionError || !session) {
        setError('Sesi voting tidak valid')
        setLoading(false)
        return
      }

      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('id, title')
        .eq('id', session.election_id)
        .single()

      if (electionError || !electionData) {
        setError('Pemilihan tidak ditemukan')
        setLoading(false)
        return
      }

      setElection(electionData)

      // Load category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', categoryId!)
        .eq('election_id', session.election_id)
        .eq('is_active', true)
        .single()

      if (categoryError || !categoryData) {
        setError('Kategori tidak ditemukan')
        setLoading(false)
        return
      }

      setCategory(categoryData)

      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', session.election_id)
        .order('order_index', { ascending: true })

      if (candidatesError) {
        setError('Gagal memuat kandidat')
        setLoading(false)
        return
      }

      setCandidates(candidatesData || [])

      // Check if voter has already voted in this category
      // Use qr_code from database session (exact match) as voter_token
      const voterToken = session.qr_code

      // Fetch user's votes to see what's done and if current category is voted
      const { data: userVotes } = await supabase
        .from('votes')
        .select('id, candidate_id, category_id')
        .eq('election_id', session.election_id)
        .eq('voter_token', voterToken)

      const currentCategoryVote = userVotes?.find(v => v.category_id === categoryId)

      if (currentCategoryVote && currentCategoryVote.candidate_id) {
        setHasExistingVotes(true)
        setExistingVoteIds([currentCategoryVote.id])
        setSelectedCandidates([currentCategoryVote.candidate_id])

        // --- PREPARE NEXT CATEGORY ---
        // Fetch all categories to find the next one
        const { data: allCategories } = await supabase
          .from('categories')
          .select('id, name')
          .eq('election_id', session.election_id)
          .eq('is_active', true)
          .order('order_index', { ascending: true })

        const votedSet = new Set(userVotes?.map(v => v.category_id) || [])
        // Find first unvoted category
        const next = allCategories?.find(c => !votedSet.has(c.id))
        setNextCategory(next || null)
      }

    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    // Prevent changing selection if already voted
    if (hasExistingVotes) return

    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return [] // Allow deselect
      } else {
        return [candidateId] // Only allow 1 selection, replace previous
      }
    })
  }

  const handleVote = async () => {
    if (selectedCandidates.length !== 1 || !qrCode || !election) return

    if (hasExistingVotes) {
      setError('Anda sudah memberikan suara dan tidak dapat mengubahnya.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Get session with qr_code to use exact value from database
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('election_id, qr_code')
        .eq('qr_code', qrCode)
        .single()

      if (sessionError || !session) {
        setError('Sesi voting tidak valid')
        setSubmitting(false)
        return
      }

      // Use exact qr_code from database as voter_token
      const voterToken = session.qr_code

      // Insert 1 vote for the selected candidate
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          election_id: session.election_id,
          category_id: categoryId!,
          candidate_id: selectedCandidates[0],
          voter_token: voterToken,
        })

      if (insertError) {
        console.error('Vote insert error:', insertError)

        if (insertError.code === '23505') {
          // Unique constraint violation
          setError('Anda sudah memberikan suara untuk kategori ini.')
          // Update state to reflect that they have voted
          setHasExistingVotes(true)
        } else {
          setError('Gagal memberikan suara: ' + (insertError.message || 'Silakan coba lagi.'))
        }
        setSubmitting(false)
        return
      }

      // --- AUTO-ADVANCE LOGIC ---
      // Fetch all active categories to find the next one
      const { data: allCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('election_id', session.election_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      // Fetch user's votes to see what's done
      const { data: userVotes } = await supabase
        .from('votes')
        .select('category_id')
        .eq('election_id', session.election_id)
        .eq('voter_token', voterToken)

      const votedSet = new Set(userVotes?.map(v => v.category_id) || [])
      // Ensure current category is marked as voted
      votedSet.add(categoryId!)

      // Find the first category that hasn't been voted yet
      const nextCategory = allCategories?.find(c => !votedSet.has(c.id))

      if (nextCategory) {
        // Redirect to next category
        router.push(`/voter/vote?qrcode=${qrCode}&category=${nextCategory.id}`)
      } else {
        // No more categories, go to success page
        router.push(`/voter/success?election=${session.election_id}&qrcode=${qrCode}&category=${categoryId}`)
      }
    } catch (err: any) {
      console.error('Vote submission error:', err)
      setError('Terjadi kesalahan: ' + (err.message || 'Silakan coba lagi.'))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (error && candidates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
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

  const selectedCount = selectedCandidates.length

  const canProceed = selectedCount === 1 && !hasExistingVotes

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Consistent with other pages */}
      <nav className="bg-black border-b border-gray-800 relative z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">JATENG</span>
              <span className="text-gray-500">|</span>
              <span className="text-white text-sm font-medium">Pilih Pejabat Favorit</span>
            </div>
            <Link href="/admin" className="text-white hover:text-gray-300 text-sm transition-colors">
              Butuh bantuan?
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pb-20 sm:pb-24">
        {/* Category Badge */}
        {category && (
          <div className="flex justify-center sm:justify-start">
            <div className={`mb-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-lg transition-all ${hasExistingVotes
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-blue-500/30 ring-2 ring-white/20'
              }`}>
              {hasExistingVotes ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>{category.name} <span className="font-normal opacity-75 mx-1">•</span> <span className="font-bold">Sudah Memilih</span></span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="tracking-wide uppercase text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold mr-1 border border-white/20">Kategori</span>
                  <span className="text-base tracking-tight">{category.name}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          Saatnya memberikan suara Anda!
        </h1>

        {/* Instructions */}
        <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
          Pilih <span className="font-bold text-gray-900">satu orang</span> yang cocok di hati anda.
        </p>

        {/* Selection Counter */}
        {selectedCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              {selectedCount} dari 1 kandidat dipilih
            </p>
          </div>
        )}

        {/* Existing Vote Info */}
        {hasExistingVotes && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Anda sudah memilih
                </p>
                <p className="text-sm text-yellow-700 mb-3">
                  Terima kasih atas partisipasi Anda. Pilihan Anda telah tersimpan dan tidak dapat diubah.
                </p>
                {nextCategory ? (
                  <Link
                    href={`/voter/vote?qrcode=${qrCode}&category=${nextCategory.id}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Lanjut ke {nextCategory.name} &rarr;
                  </Link>
                ) : (
                  <Link
                    href={`/voter/success?election=${election?.id}&qrcode=${qrCode}&category=${categoryId}`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Lihat Hasil &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Candidate Cards */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {candidates.map((candidate) => {
            const isSelected = selectedCandidates.includes(candidate.id)
            return (
              <div
                key={candidate.id}
                onClick={() => toggleCandidate(candidate.id)}
                className={`bg-white border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all ${isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Candidate Photo */}
                  <div className="flex-shrink-0">
                    {candidate.photo_url ? (
                      <Image
                        src={candidate.photo_url}
                        alt={candidate.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover w-14 h-14 sm:w-16 sm:h-16"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl sm:text-2xl">
                        👤
                      </div>
                    )}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                      {candidate.name}
                    </h3>
                    {candidate.description && (
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {candidate.description}
                      </p>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Security Message - Matching Image Design */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Suara Anda bersifat rahasia dan aman.</span>
        </div>

        {/* Next Button */}
        <button
          onClick={() => {
            if (canProceed) {
              setShowConfirm(true)
            }
          }}
          disabled={!canProceed}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 rounded-xl text-base sm:text-lg transition-all shadow-lg ${canProceed
            ? 'opacity-100 cursor-pointer'
            : 'opacity-50 cursor-not-allowed'
            }`}
        >
          Lanjutkan
        </button>
      </div>

      {/* Footer - Matching Image Design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <a
            href="https://garuda-21.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors"
          >
            Powered by GARUDA-21.com
          </a>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6 sm:hidden"></div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Konfirmasi pilihan Anda!</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Tinjau pilihan Anda dan ketuk 'Konfirmasi Suara' untuk memberikan suara.
            </p>

            {/* Selected Candidates */}
            <div className="mb-6 space-y-4">
              {selectedCandidates.map((candidateId, index) => {
                const candidate = candidates.find(c => c.id === candidateId)
                if (!candidate) return null
                return (
                  <div key={candidateId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {candidate.photo_url ? (
                        <Image
                          src={candidate.photo_url}
                          alt={candidate.name}
                          width={64}
                          height={64}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{candidate.name}</p>
                      {candidate.description && (
                        <p className="text-sm text-gray-600">{candidate.description}</p>
                      )}
                    </div>
                    <div className="text-blue-600 font-bold text-lg">{index + 1}</div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleVote}
              disabled={submitting || selectedCandidates.length !== 1}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg mb-3 transition-all shadow-lg ${submitting || selectedCandidates.length !== 1
                ? 'opacity-50 cursor-not-allowed'
                : 'opacity-100 cursor-pointer'
                }`}
            >
              {submitting ? 'Mengirim...' : 'Konfirmasi Suara'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 text-base transition-colors"
            >
              Ubah Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-20 sm:bottom-24 left-4 right-4 max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[60]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
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
