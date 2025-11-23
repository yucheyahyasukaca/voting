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
  const [resetting, setResetting] = useState(false)
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

  const resetAllVotes = async () => {
    if (!electionId) return

    // Double confirmation to prevent accidental reset
    const firstConfirm = confirm(
      '⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA voting?\n\n' +
      'Tindakan ini akan:\n' +
      '• Menghapus semua data voting untuk pemilihan ini\n' +
      '• Menghapus semua suara dari semua kategori\n' +
      '• TIDAK DAPAT DIBATALKAN\n\n' +
      'Klik OK untuk melanjutkan atau Cancel untuk membatalkan.'
    )

    if (!firstConfirm) return

    const secondConfirm = confirm(
      '⚠️ KONFIRMASI TERAKHIR!\n\n' +
      'Anda akan menghapus SEMUA voting. Pastikan ini yang Anda inginkan.\n\n' +
      'Klik OK untuk menghapus semua voting atau Cancel untuk membatalkan.'
    )

    if (!secondConfirm) return

    setResetting(true)

    try {
      // Delete all votes for this election
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('election_id', electionId)

      if (deleteError) {
        console.error('Error deleting votes:', deleteError)
        alert('Gagal menghapus voting: ' + (deleteError.message || 'Unknown error'))
        setResetting(false)
        return
      }

      // Reload results to show updated data
      await loadResults(true)

      alert('✅ Semua voting berhasil dihapus!')
    } catch (error: any) {
      console.error('Error resetting votes:', error)
      alert('Terjadi kesalahan saat menghapus voting: ' + (error.message || 'Unknown error'))
    } finally {
      setResetting(false)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hasil Voting Live (Admin)
            </h1>
            {election && (
              <p className="text-gray-600">Pantau perkembangan pemilihan.</p>
            )}
          </div>
          <button
            onClick={resetAllVotes}
            disabled={resetting || totalVotes === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              resetting || totalVotes === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'
            }`}
            title={totalVotes === 0 ? 'Tidak ada voting untuk dihapus' : 'Hapus semua voting'}
          >
            {resetting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menghapus...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset Semua Voting
              </span>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6">
          {/* Total Suara Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-slate-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-transparent opacity-50"></div>
                          <div className="relative p-4 sm:p-5 md:p-6">
                              <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2 uppercase tracking-wide">Total Suara</p>
                                  <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-none mb-1 sm:mb-2">{totalVotes}</p>
                                  <p className="text-slate-500 text-xs font-medium hidden sm:block">QR Code Aktif</p>
                                </div>
                                <div className="flex-shrink-0 ml-2 sm:ml-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
          </div>

          {/* Kemajuan Voting Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-blue-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-transparent opacity-50"></div>
                            <div className="relative p-4 sm:p-5 md:p-6">
                              <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2 uppercase tracking-wide">Kemajuan Voting</p>
                                  <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-none mb-2">{votingProgress}%</p>
                                  <div className="w-full bg-blue-100 rounded-full h-1.5 sm:h-2 mt-2 sm:mt-3">
                                    <div 
                                      className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out"
                                      style={{ width: `${votingProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-2 sm:ml-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
          </div>
        </div>

        {/* Time Remaining Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 mb-6 border border-gray-200/50">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 to-transparent opacity-50"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">Waktu Tersisa</p>
              </div>
            </div>
            <div className="flex items-end gap-3 md:gap-6">
              <div className="text-center flex-1">
                <p className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-none mb-1">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </p>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Jam</p>
              </div>
              <div className="text-slate-400 text-2xl md:text-3xl font-bold pb-1">:</div>
              <div className="text-center flex-1">
                <p className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-none mb-1">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </p>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Menit</p>
              </div>
              <div className="text-slate-400 text-2xl md:text-3xl font-bold pb-1">:</div>
              <div className="text-center flex-1">
                <p className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-none mb-1">
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </p>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Detik</p>
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
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                      {/* Total Suara Card */}
                      <div className="group relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-transparent opacity-50"></div>
                        <div className="relative p-3 sm:p-4 md:p-5">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </div>
                                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide truncate">Total Suara</p>
                              </div>
                            </div>
                            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-none mb-1">{categoryResult.totalVotes}</p>
                            <p className="text-slate-500 text-xs font-medium hidden sm:block">Kategori ini</p>
                          </div>
                      </div>

                      {/* Kemajuan Voting Card */}
                      <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-transparent opacity-50"></div>
                        <div className="relative p-3 sm:p-4 md:p-5">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide truncate">Kemajuan Voting</p>
                              </div>
                            </div>
                            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-none mb-1 sm:mb-2">{categoryResult.votingProgress}%</p>
                            <div className="w-full bg-blue-100 rounded-full h-1 sm:h-1.5">
                              <div 
                                className="bg-blue-600 h-1 sm:h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${categoryResult.votingProgress}%` }}
                              ></div>
                            </div>
                          </div>
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

