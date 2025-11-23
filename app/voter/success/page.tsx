'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  description: string | null
  icon_url: string | null
}

interface Election {
  id: string
  allow_view_results: boolean
}

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const electionId = searchParams.get('election')
  const qrCode = searchParams.get('qrcode')
  const categoryId = searchParams.get('category')
  
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [votedCategories, setVotedCategories] = useState<string[]>([])
  const [nextCategory, setNextCategory] = useState<Category | null>(null)
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [voterToken, setVoterToken] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (!electionId) {
      setLoading(false)
      return
    }
    loadVotingProgress()
  }, [electionId, qrCode])

  const loadVotingProgress = async () => {
    try {
      // Get QR code from URL or session
      let token = qrCode
      
      if (!token && electionId) {
        // Try to get from voting_sessions
        const { data: sessions } = await supabase
          .from('voting_sessions')
          .select('qr_code')
          .eq('election_id', electionId!)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (sessions && sessions.length > 0) {
          token = sessions[0].qr_code
        }
      }

      if (!token || !electionId) {
        setLoading(false)
        return
      }

      setVoterToken(token)

      // Load election data to check allow_view_results
      const { data: electionData } = await supabase
        .from('elections')
        .select('id, allow_view_results')
        .eq('id', electionId!)
        .single()

      if (electionData) {
        setElection(electionData)
      }

      // Load all active categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', electionId!)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (!categoriesData || categoriesData.length === 0) {
        setLoading(false)
        return
      }

      setAllCategories(categoriesData)

      // Load voted categories for this voter
      const { data: votesData } = await supabase
        .from('votes')
        .select('category_id')
        .eq('election_id', electionId!)
        .eq('voter_token', token)

      const votedCategoryIds = new Set<string>()
      votesData?.forEach((vote) => {
        if (vote.category_id) {
          votedCategoryIds.add(vote.category_id)
        }
      })

      setVotedCategories(Array.from(votedCategoryIds))

      // Find next category to vote
      const nextCat = categoriesData.find(
        (cat) => !votedCategoryIds.has(cat.id)
      )

      setNextCategory(nextCat || null)
    } catch (err) {
      console.error('Error loading voting progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalCategories = allCategories.length
  const votedCount = votedCategories.length
  const remainingCount = totalCategories - votedCount

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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

      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md w-full">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-5xl">👍</span>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Berhasil!
          </h1>
          
          <p className="text-xl font-semibold text-gray-900 mb-4">
            Suara Anda telah tercatat.
          </p>

          {/* Voting Progress */}
          {loading ? (
            <div className="mb-6">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          ) : totalCategories > 1 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Progress Voting
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-600">{votedCount}</span>
                <span className="text-gray-600">dari</span>
                <span className="text-2xl font-bold text-blue-600">{totalCategories}</span>
                <span className="text-gray-600">kategori</span>
              </div>
              {remainingCount > 0 && (
                <p className="text-xs text-blue-700">
                  Masih ada {remainingCount} kategori yang belum Anda pilih
                </p>
              )}
              {remainingCount === 0 && (
                <p className="text-xs text-green-700 font-medium">
                  ✓ Anda telah menyelesaikan semua kategori!
                </p>
              )}
            </div>
          )}
          
          <p className="text-gray-600 mb-8">
            Terima kasih telah berpartisipasi dalam pemilihan. Pantau update real-time tentang perkembangan pemilihan.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {nextCategory && voterToken && (
              <Link
                href={`/voter/vote?qrcode=${voterToken}&category=${nextCategory.id}`}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Pilih Kategori Selanjutnya: {nextCategory.name}
              </Link>
            )}

            {!nextCategory && totalCategories > 1 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-3">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Anda telah menyelesaikan semua kategori pemilihan!
                </p>
              </div>
            )}

            {electionId && (
              <>
                {election?.allow_view_results ? (
                  <Link
                    href={`/voter/results?election=${electionId}`}
                    className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Lihat Hasil Live
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setShowToast(true)
                      setTimeout(() => setShowToast(false), 5000)
                    }}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Lihat Hasil Live
                  </button>
                )}
              </>
            )}

            {voterToken && (
              <Link
                href={`/voter/categories?qrcode=${voterToken}`}
                className="block w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium transition-colors"
              >
                Lihat Semua Kategori
              </Link>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Suara Anda bersifat rahasia dan tidak dapat diubah
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none sm:items-center sm:p-6">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fadeIn pointer-events-auto"
            onClick={() => setShowToast(false)}
          />
          
          {/* Toast Card */}
          <div className="relative w-full max-w-md pointer-events-auto animate-slide-up">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
              {/* Decorative Top Bar */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
              
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  {/* Icon with Animation */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      {/* Pulse Effect */}
                      <div className="absolute inset-0 bg-orange-400 rounded-2xl animate-ping opacity-20"></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                        Hasil Belum Tersedia
                      </h3>
                      {/* Close Button */}
                      <button
                        onClick={() => setShowToast(false)}
                        className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 active:scale-95"
                        aria-label="Tutup"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed pr-2">
                      Maaf, panitia belum mengizinkan untuk melihat hasil voting saat ini. Hasil akan ditampilkan nanti untuk menambah kejutan dan kemeriahan pemilihan. Terima kasih ya! 😊
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar (Auto Dismiss Indicator) */}
                <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-progress"
                    style={{ animationDuration: '5s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2">
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
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
