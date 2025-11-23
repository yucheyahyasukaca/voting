'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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
  const qrCode = searchParams.get('qrcode')
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

  useEffect(() => {
    if (!qrCode || !categoryId) {
      setError('Parameter tidak valid')
      setLoading(false)
      return
    }

    loadElectionData()
  }, [qrCode, categoryId])

  const loadElectionData = async () => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('election_id')
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
      const voterToken = qrCode!
      const { data: existingVotesData } = await supabase
        .from('votes')
        .select('id, candidate_id')
        .eq('election_id', session.election_id)
        .eq('category_id', categoryId!)
        .eq('voter_token', voterToken)

      if (existingVotesData && existingVotesData.length > 0) {
        setHasExistingVotes(true)
        const voteIds = existingVotesData.map(v => v.id)
        const candidateIds = existingVotesData.map(v => v.candidate_id).filter(Boolean) as string[]
        setExistingVoteIds(voteIds)
        // Pre-select candidates that were already voted
        if (candidateIds.length > 0) {
          setSelectedCandidates(candidateIds)
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId)
      } else if (prev.length < 2) {
        return [...prev, candidateId]
      }
      return prev
    })
  }

  const handleVote = async () => {
    if (selectedCandidates.length !== 2 || !qrCode || !election) return

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

      // ALWAYS delete existing votes for this voter in this category first (allow re-voting)
      // Wait for delete to complete before inserting
      const { error: deleteError, count: deleteCount } = await supabase
        .from('votes')
        .delete()
        .eq('election_id', session.election_id)
        .eq('category_id', categoryId!)
        .eq('voter_token', voterToken)
        .select()

      if (deleteError) {
        console.error('Error deleting existing votes:', deleteError)
        // Don't continue if delete fails - might cause conflicts
        setError('Gagal mengupdate pilihan. Silakan coba lagi.')
        setSubmitting(false)
        return
      }

      // Small delay to ensure delete is committed (optional but safer)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Insert 2 votes for the 2 selected candidates
      const votesToInsert = selectedCandidates.map(candidateId => ({
        election_id: session.election_id,
        category_id: categoryId!,
        candidate_id: candidateId,
        voter_token: voterToken,
      }))

      // Insert all votes at once (better performance)
      const { data: insertedVotes, error: insertError } = await supabase
        .from('votes')
        .insert(votesToInsert)
        .select()

      if (insertError) {
        console.error('Vote insert error:', insertError)
        
        // If still conflict after delete, there might be a constraint issue
        if (insertError.code === '23505') {
          const errorMsg = insertError.message || ''
          
          // Check which constraint is failing
          if (errorMsg.includes('votes_election_id_category_id_voter_token_key')) {
            // Old constraint still exists - database needs to be fixed
            setError('Database constraint belum diperbaiki. Silakan hubungi administrator.')
          } else if (errorMsg.includes('votes_election_id_category_id_voter_token_candidate_id_key')) {
            // New constraint - probably trying to vote for same candidate twice
            setError('Anda sudah memilih kandidat ini. Silakan pilih kandidat yang berbeda.')
          } else {
            setError('Gagal memberikan suara. Silakan coba lagi.')
          }
        } else if (insertError.code === '409') {
          setError('Terjadi konflik saat menyimpan suara. Silakan coba lagi.')
        } else {
          setError('Gagal memberikan suara: ' + (insertError.message || 'Silakan coba lagi.'))
        }
        setSubmitting(false)
        return
      }

      router.push(`/voter/success?election=${session.election_id}&qrcode=${qrCode}&category=${categoryId}`)
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
  const canProceed = selectedCount === 2

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
          <div className="mb-4 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {category.name}
          </div>
        )}
        
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          Saatnya memberikan suara Anda!
        </h1>
        
        {/* Instructions */}
        <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
          Pilih <span className="font-bold text-gray-900">dua orang</span> yang cocok di hati anda.
        </p>

        {/* Selection Counter */}
        {selectedCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              {selectedCount} dari 2 kandidat dipilih
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
                  Anda sudah memilih sebelumnya
                </p>
                <p className="text-sm text-yellow-700">
                  Anda dapat mengubah pilihan Anda dengan memilih kandidat baru dan mengkonfirmasi ulang.
                </p>
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
                className={`bg-white border-2 rounded-xl p-4 sm:p-5 cursor-pointer transition-all ${
                  isSelected
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
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-6 rounded-xl text-base sm:text-lg transition-all shadow-lg ${
            canProceed
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
              disabled={submitting || selectedCandidates.length !== 2}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg mb-3 transition-all shadow-lg ${
                submitting || selectedCandidates.length !== 2
                  ? 'opacity-50 cursor-not-allowed'
                  : 'opacity-100 cursor-pointer'
              }`}
            >
              {submitting ? 'Mengirim...' : hasExistingVotes ? 'Update Pilihan' : 'Konfirmasi Suara'}
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
        <div className="fixed bottom-20 sm:bottom-24 left-4 right-4 max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-40">
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
