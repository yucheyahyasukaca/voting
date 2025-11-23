'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Election {
  id: string
  title: string
  description: string
}

interface CandidateResult {
  id: string
  name: string
  description: string
  photo_url: string | null
  vote_count: number
  percentage: number
  category_id?: string
}

interface Category {
  id: string
  name: string
  description: string | null
  order_index: number
  is_active: boolean
}

interface CategoryResults {
  category: Category
  candidates: CandidateResult[]
  totalVotes: number
  votingProgress: number
}

export default function AdminResultsPage() {
  const params = useParams()
  const electionId = params.id as string
  
  const [election, setElection] = useState<Election | null>(null)
  const [results, setResults] = useState<CandidateResult[]>([])
  const [categoryResults, setCategoryResults] = useState<CategoryResults[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategoryTab, setActiveCategoryTab] = useState<string | null>(null)
  const activeCategoryTabRef = useRef<string | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [votingProgress, setVotingProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!electionId) return

    loadResults()
    
    // Refresh setiap 10 detik untuk update real-time
    // Jangan ubah activeCategoryTab saat refresh
    const interval = setInterval(() => {
      // Load results tanpa mengubah activeCategoryTab
      loadResults(false) // false = tidak reset tab
    }, 10000)

    return () => clearInterval(interval)
  }, [electionId])

  useEffect(() => {
    // Mock countdown timer
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
          if (minutes < 0) {
            minutes = 59
            hours--
            if (hours < 0) {
              hours = 0
              minutes = 0
              seconds = 0
            }
          }
        }
        return { hours, minutes, seconds }
      })
    }, 1000)

    // Set initial time
    setTimeRemaining({ hours: 2, minutes: 25, seconds: 45 })

    return () => clearInterval(interval)
  }, [])

  const loadResults = async (shouldSetDefaultTab: boolean = true) => {
    if (!electionId) return

    try {
      const { data: electionData } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single()

      if (electionData) {
        setElection(electionData)
      }

      const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true })

      if (!candidates) return

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', electionId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (categoriesData && categoriesData.length > 0) {
        // Hanya update categories, tidak mengubah activeCategoryTab
        setCategories(categoriesData)
        
        // HANYA set/ubah activeCategoryTab saat first load (shouldSetDefaultTab = true)
        // Saat auto-refresh (shouldSetDefaultTab = false), SKIP seluruh logic ini
        if (shouldSetDefaultTab) {
          // Cek apakah sudah ada tab aktif (dari ref atau state)
          const currentActiveTab = activeCategoryTabRef.current || activeCategoryTab
          
          if (!currentActiveTab) {
            // First load: set tab pertama sebagai default
            const firstCategoryId = categoriesData[0].id
            setActiveCategoryTab(firstCategoryId)
            activeCategoryTabRef.current = firstCategoryId
          } else {
            // Cek apakah tab yang dipilih masih valid
            const selectedTabExists = categoriesData.some(cat => cat.id === currentActiveTab)
            if (!selectedTabExists) {
              // Tab tidak ada lagi - pindah ke tab pertama
              const firstCategoryId = categoriesData[0].id
              setActiveCategoryTab(firstCategoryId)
              activeCategoryTabRef.current = firstCategoryId
            }
            // Jika tab masih ada, tidak perlu mengubah apapun
          }
        }
        // else: auto-refresh - SKIP semua logic, biarkan activeCategoryTab tetap seperti sekarang
      }

      const { data: votes } = await supabase
        .from('votes')
        .select('candidate_id, voter_token, category_id')
        .eq('election_id', electionId)

      // Calculate total unique QR codes used for voting
      // "Total Suara" = jumlah QR code unik yang sudah digunakan untuk vote
      const uniqueVoters = new Set(votes?.map(vote => vote.voter_token).filter(Boolean) || [])
      const totalUniqueVoters = uniqueVoters.size
      setTotalVotes(totalUniqueVoters)

      // Calculate voting progress: % of voters who have voted
      // Get total active voting sessions (unique QR codes)
      const { data: votingSessions } = await supabase
        .from('voting_sessions')
        .select('qr_code')
        .eq('election_id', electionId)
        .eq('is_active', true)

      const totalSessions = votingSessions?.length || 0

      // Get unique voters who have voted (count distinct voter_token)
      const votersWhoVoted = uniqueVoters.size

      // Calculate percentage
      const progress = totalSessions > 0 ? (votersWhoVoted / totalSessions) * 100 : 0
      setVotingProgress(Math.round(progress))

      // Calculate results per category
      if (categoriesData && categoriesData.length > 0) {
        const categoryResultsData: CategoryResults[] = []

        categoriesData.forEach((category) => {
          // Filter votes for this category
          const categoryVotes = votes?.filter(vote => vote.category_id === category.id) || []
          
          // Calculate unique QR codes for this category
          const uniqueVotersInCategory = new Set(categoryVotes.map(vote => vote.voter_token).filter(Boolean))
          const totalVotesInCategory = uniqueVotersInCategory.size

          // Calculate unique QR codes per candidate in this category
          const voteCountsByCandidate: Record<string, Set<string>> = {}
          categoryVotes.forEach((vote) => {
            if (!voteCountsByCandidate[vote.candidate_id]) {
              voteCountsByCandidate[vote.candidate_id] = new Set()
            }
            voteCountsByCandidate[vote.candidate_id].add(vote.voter_token)
          })

          // Get candidates for this category (all candidates are shown per category for now)
          const candidateResultsForCategory: CandidateResult[] = candidates.map((candidate) => {
            const uniqueQRCodesForCandidate = voteCountsByCandidate[candidate.id]?.size || 0
            return {
              ...candidate,
              category_id: category.id,
              vote_count: uniqueQRCodesForCandidate,
              percentage: totalVotesInCategory > 0 ? (uniqueQRCodesForCandidate / totalVotesInCategory) * 100 : 0,
            }
          })

          candidateResultsForCategory.sort((a, b) => b.vote_count - a.vote_count)

          // Calculate voting progress for this category
          const categoryProgress = totalSessions > 0 ? (totalVotesInCategory / totalSessions) * 100 : 0

          categoryResultsData.push({
            category,
            candidates: candidateResultsForCategory,
            totalVotes: totalVotesInCategory,
            votingProgress: Math.round(categoryProgress),
          })
        })

        setCategoryResults(categoryResultsData)
      } else {
        // Fallback: if no categories, show all candidates together (backward compatibility)
        const voteCountsByCandidate: Record<string, Set<string>> = {}
        votes?.forEach((vote) => {
          if (!voteCountsByCandidate[vote.candidate_id]) {
            voteCountsByCandidate[vote.candidate_id] = new Set()
          }
          voteCountsByCandidate[vote.candidate_id].add(vote.voter_token)
        })

        const candidateResults: CandidateResult[] = candidates.map((candidate) => {
          const uniqueQRCodesForCandidate = voteCountsByCandidate[candidate.id]?.size || 0
          return {
            ...candidate,
            vote_count: uniqueQRCodesForCandidate,
            percentage: totalUniqueVoters > 0 ? (uniqueQRCodesForCandidate / totalUniqueVoters) * 100 : 0,
          }
        })

        candidateResults.sort((a, b) => b.vote_count - a.vote_count)
        setResults(candidateResults)
      }
    } catch (err) {
      console.error('Error loading results:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat hasil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/admin/elections/${electionId}`} className="text-blue-600 hover:underline">
              ← Kembali ke Detail Pemilihan
            </Link>
            <Link href={`/voter/results?election=${electionId}`} target="_blank" className="text-blue-600 hover:underline">
              Lihat Halaman Public →
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hasil Voting Live (Admin)
        </h1>
        {election && (
          <p className="text-gray-600 mb-8">Pantau perkembangan pemilihan.</p>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Suara</p>
                <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
              </div>
              <div className="text-4xl">👤</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Kemajuan Voting</p>
                <p className="text-3xl font-bold text-green-600">{votingProgress}%</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>
        </div>

        {/* Time Remaining Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🕐</div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm mb-2">Waktu Tersisa</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-gray-500">Jam</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-gray-500">Menit</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </p>
                  <p className="text-xs text-gray-500">Detik</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Election Summary with Category Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ringkasan Pemilihan</h2>
            <span className="text-xl">📊</span>
          </div>

          {/* Category Tabs */}
          {categoryResults.length > 0 ? (
            <div>
              {/* Tabs - Scrollable on mobile */}
              <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2 min-w-max md:flex-wrap">
                  {categoryResults.map((categoryResult) => (
                    <button
                      key={categoryResult.category.id}
                      onClick={() => {
                        setActiveCategoryTab(categoryResult.category.id)
                        activeCategoryTabRef.current = categoryResult.category.id
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                        activeCategoryTab === categoryResult.category.id
                          ? 'bg-blue-600 text-white shadow-md transform scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {categoryResult.category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {categoryResults.map((categoryResult) => {
                if (activeCategoryTab !== categoryResult.category.id) return null

                const candidates = categoryResult.candidates

                return (
                  <div key={categoryResult.category.id} className="animate-fadeIn">
                    {/* Category Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">👤</span>
                          <p className="text-sm text-gray-600">Total Suara</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{categoryResult.totalVotes}</p>
                        <p className="text-xs text-gray-500 mt-1">Kategori ini</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">✓</span>
                          <p className="text-sm text-gray-600">Kemajuan Voting</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{categoryResult.votingProgress}%</p>
                        <p className="text-xs text-gray-500 mt-1">Kategori ini</p>
                      </div>
                    </div>

                    {/* Candidate Results */}
                    {candidates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        Belum ada hasil voting untuk kategori ini
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {candidates.map((candidate, index) => (
                          <div
                            key={candidate.id}
                            className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                              index === 0 && candidate.vote_count > 0
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-shrink-0">
                                {candidate.photo_url ? (
                                  <Image
                                    src={candidate.photo_url}
                                    alt={candidate.name}
                                    width={60}
                                    height={60}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">
                                    👤
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {candidate.name}
                                </h3>
                                {candidate.description && (
                                  <p className="text-gray-600 text-sm">{candidate.description}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                  {candidate.vote_count} suara
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                  {candidate.percentage.toFixed(0)}%
                                </p>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  index === 0 && candidate.vote_count > 0
                                    ? 'bg-yellow-400'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${candidate.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : results.length > 0 ? (
            // Fallback: No categories, show all candidates
            <div className="space-y-4">
              {results.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`border-2 rounded-lg p-4 ${
                    index === 0 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-shrink-0">
                      {candidate.photo_url ? (
                        <Image
                          src={candidate.photo_url}
                          alt={candidate.name}
                          width={60}
                          height={60}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {candidate.name}
                      </h3>
                      {candidate.description && (
                        <p className="text-gray-600 text-sm">{candidate.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {candidate.vote_count} suara
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {candidate.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        index === 0 ? 'bg-yellow-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${candidate.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Belum ada hasil voting
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadResults}
            className="text-blue-600 hover:underline flex items-center gap-2 mx-auto"
          >
            <span>🔄</span>
            <span>Muat Ulang</span>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Hasil diperbarui secara real-time</p>
        </div>
      </div>
    </div>
  )
}

