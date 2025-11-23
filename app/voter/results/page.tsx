'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from '@/components/QRCode'
import { getVotingUrl } from '@/lib/app-url'

interface Election {
  id: string
  title: string
  description: string
  end_date: string
  allow_view_results: boolean
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

interface VotingSession {
  qr_code: string
}

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const electionId = searchParams.get('election')
  
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
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [greeting, setGreeting] = useState('')

  // Get greeting based on local time
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        return 'Selamat Pagi'
      } else if (hour >= 12 && hour < 17) {
        return 'Selamat Siang'
      } else if (hour >= 17 && hour < 21) {
        return 'Selamat Sore'
      } else {
        return 'Selamat Malam'
      }
    }
    setGreeting(getGreeting())
  }, [])

  useEffect(() => {
    if (!electionId) return

    loadResults()
    loadVotingSession()
    
    // Refresh setiap 10 detik untuk update real-time
    // Jangan ubah activeCategoryTab saat refresh
    const interval = setInterval(() => {
      // Load results tanpa mengubah activeCategoryTab
      loadResults(false) // false = tidak reset tab
    }, 10000)

    return () => clearInterval(interval)
  }, [electionId])

  useEffect(() => {
    if (!election) return

    const calculateTimeRemaining = () => {
      const endDate = new Date(election.end_date)
      const now = new Date()
      const diff = endDate.getTime() - now.getTime()

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeRemaining({ hours, minutes, seconds })
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [election])

  const loadVotingSession = async () => {
    if (!electionId) return

    try {
      const { data } = await supabase
        .from('voting_sessions')
        .select('qr_code')
        .eq('election_id', electionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setVotingSession(data)
      }
    } catch (err) {
      console.error('Error loading voting session:', err)
    }
  }

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

  // Extract number from title
  const titleMatch = election?.title.match(/(\d+)/)
  const titleNumber = titleMatch ? titleMatch[1] : '2025'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Memuat hasil...</p>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Pemilihan tidak ditemukan</h1>
        </div>
      </div>
    )
  }

  // Check if admin allows viewing results
  if (!election.allow_view_results) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Navigation Bar */}
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

        <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-md w-full">
            {/* Lock Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Hasil Belum Tersedia
            </h1>
            
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <p className="text-gray-300 text-lg mb-4">
                Panitia tidak mengizinkan melihat hasil sebelum waktunya
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Untuk memberi kejutan dan kemeriahan pemilihan, hasil voting akan ditampilkan pada waktu yang telah ditentukan oleh panitia. Terima kasih atas pengertian Anda.
              </p>
            </div>

            {votingSession && (
              <Link
                href={`/voter?qrcode=${votingSession.qr_code}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Kembali ke Beranda
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <a 
              href="https://garuda-21.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm transition-colors"
            >
              Powered by GARUDA-21.com
            </a>
          </div>
        </div>
      </div>
    )
  }

  const qrCodeValue = votingSession ? getVotingUrl(votingSession.qr_code) : ''

  return (
    <div className="min-h-screen lg:h-screen bg-black lg:overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-4 py-2 lg:py-3">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
            {/* Left - Title */}
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-yellow-400 font-black text-xl lg:text-2xl">{titleNumber}</span>
              <span className="text-white text-xs lg:text-sm ml-2">MALAM RESEPSI</span>
            </div>

            {/* Center - JATENG | Pilih Pejabat Favorit LIVE */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xs lg:text-sm">JATENG</span>
                <span className="text-gray-500">|</span>
                <span className="text-white text-xs lg:text-sm font-medium">Pilih Pejabat Favorit</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-600 border-2 border-white rounded-lg px-2 py-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                <span className="text-white text-xs font-bold">LIVE</span>
              </div>
            </div>

            {/* Right - Timer (Desktop) */}
            <div className="hidden md:flex items-center justify-end">
              <div className="text-white">
                <p className="text-xs text-gray-300 mb-1 text-right">Waktu Tersisa</p>
                <div className="flex items-end gap-2">
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-white leading-none mb-0.5">
                      {String(timeRemaining.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Jam</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-white leading-none mb-0.5">
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Menit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl lg:text-2xl font-bold text-white leading-none mb-0.5">
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-300">Detik</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer - Mobile only */}
          <div className="flex md:hidden items-center justify-center mt-2">
            <div className="text-white">
              <p className="text-xs text-gray-300 mb-1 text-center">Waktu Tersisa</p>
              <div className="flex items-end gap-2 justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-white leading-none mb-0.5">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300">Jam</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white leading-none mb-0.5">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300">Menit</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white leading-none mb-0.5">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-300">Detik</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-3 lg:py-4 w-full lg:overflow-hidden">
        <div className="bg-gray-100 rounded-2xl shadow-2xl p-4 lg:p-6 lg:h-full lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-6 lg:h-full">
            {/* Left Panel - QR Code */}
            <div className="flex flex-col items-center justify-start">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 text-center">
                Scan QR Code untuk Vote
              </h2>
              <p className="text-gray-600 text-sm mb-3 text-center">
                Arahkan kamera perangkat Anda ke kode & mulai!
              </p>
              {qrCodeValue ? (
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <QRCode value={qrCodeValue} size={200} />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-200 rounded-2xl flex items-center justify-center">
                  <p className="text-gray-500 text-sm">QR Code tidak tersedia</p>
                </div>
              )}
            </div>

            {/* Right Panel - Results */}
            <div className="flex flex-col min-h-0">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                Hasil Vote Saat Ini
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                Pantau perkembangan pemilihan yang sedang berlangsung.
              </p>

              {/* Category Tabs */}
              {categoryResults.length > 0 ? (
                <div>
                  {/* Mobile Dropdown */}
                  <div className="md:hidden mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Pilih Kategori:
                    </label>
                    <div className="relative">
                      <select
                        value={activeCategoryTab || ''}
                        onChange={(e) => {
                          setActiveCategoryTab(e.target.value)
                          activeCategoryTabRef.current = e.target.value
                        }}
                        className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer shadow-sm hover:border-gray-300 transition-all"
                      >
                        {categoryResults.map((categoryResult) => (
                          <option key={categoryResult.category.id} value={categoryResult.category.id}>
                            {categoryResult.category.name} ({categoryResult.totalVotes} suara)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Tabs */}
                  <div className="hidden md:block mb-3">
                    <div className="flex gap-2 flex-wrap">
                      {categoryResults.map((categoryResult) => (
                        <button
                          key={categoryResult.category.id}
                          onClick={() => {
                            setActiveCategoryTab(categoryResult.category.id)
                            activeCategoryTabRef.current = categoryResult.category.id
                          }}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                            activeCategoryTab === categoryResult.category.id
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{categoryResult.category.name}</span>
                            <span className="text-xs opacity-80">({categoryResult.totalVotes})</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  {categoryResults.map((categoryResult) => {
                    if (activeCategoryTab !== categoryResult.category.id) return null

                    const candidates = categoryResult.candidates

                    return (
                      <div key={categoryResult.category.id} className="space-y-2 animate-fadeIn">
                        {/* Category Stats */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {/* Total Suara Card */}
                          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 rounded-xl shadow-sm border border-slate-200/50">
                            <div className="relative p-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide mb-0.5">Total Suara</p>
                                  <p className="text-xl lg:text-2xl font-extrabold text-slate-900 leading-none">{categoryResult.totalVotes}</p>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Kemajuan Voting Card */}
                          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200/50">
                            <div className="relative p-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide mb-0.5">Kemajuan</p>
                                  <p className="text-xl lg:text-2xl font-extrabold text-slate-900 leading-none mb-1">{categoryResult.votingProgress}%</p>
                                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                                      style={{ width: `${categoryResult.votingProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Candidate Results - Scrollable Container */}
                        {candidates.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-white rounded-xl text-sm">
                            Belum ada hasil voting untuk kategori ini
                          </div>
                        ) : (
                          <div className="space-y-2 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto pr-2 custom-scrollbar">
                            {candidates.map((candidate, index) => (
                              <div
                                key={candidate.id}
                                className={`bg-white rounded-lg p-2.5 shadow-sm transition-all hover:shadow-md ${
                                  index === 0 && candidate.vote_count > 0
                                    ? 'border-2 border-yellow-400'
                                    : 'border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex-shrink-0">
                                    {candidate.photo_url ? (
                                      <Image
                                        src={candidate.photo_url}
                                        alt={candidate.name}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover w-12 h-12"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
                                        👤
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 truncate">
                                      {candidate.name}
                                    </h3>
                                    {candidate.description && (
                                      <p className="text-xs text-gray-600 truncate">{candidate.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-lg font-bold text-gray-900">
                                      {candidate.percentage.toFixed(0)}%
                                    </p>
                                    <p className="text-xs text-gray-500">{candidate.vote_count} suara</p>
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
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
                  {results.slice(0, 3).map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`bg-white rounded-xl p-4 shadow-md ${
                        index === 0 ? 'border-2 border-yellow-400' : 'border border-gray-200'
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {candidate.name}
                          </h3>
                          {candidate.description && (
                            <p className="text-sm text-gray-600 truncate">{candidate.description}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-900">
                            {candidate.percentage.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">{candidate.vote_count} suara</p>
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
                  
                  {/* Summary Stats */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👤</span>
                        <p className="text-sm text-gray-600">Total Suara</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{totalVotes}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">✓</span>
                        <p className="text-sm text-gray-600">Kemajuan Voting</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{votingProgress}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                  Belum ada hasil voting
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Memuat hasil...</p>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}
