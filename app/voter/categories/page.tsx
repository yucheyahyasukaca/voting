'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  order_index: number
}

interface Election {
  id: string
  title: string
}

function CategoriesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrCode = searchParams.get('qrcode')
  
  const [categories, setCategories] = useState<Category[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [votedCategoryIds, setVotedCategoryIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!qrCode) {
      setError('QR Code tidak valid')
      setLoading(false)
      return
    }

    loadElectionData()
  }, [qrCode])

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

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', session.election_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (categoriesError) {
        setError('Gagal memuat kategori')
        setLoading(false)
        return
      }

      setCategories(categoriesData || [])

      // Load voted categories for this voter
      const { data: votesData } = await supabase
        .from('votes')
        .select('category_id')
        .eq('election_id', session.election_id)
        .eq('voter_token', qrCode!)

      const votedIds = new Set<string>()
      votesData?.forEach((vote) => {
        if (vote.category_id) {
          votedIds.add(vote.category_id)
        }
      })

      setVotedCategoryIds(votedIds)
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
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

  if (error || !election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-6">{error || 'Pemilihan tidak ditemukan'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Kategori</h1>
          <p className="text-gray-600 mb-6">
            Belum ada kategori pemilihan yang tersedia. Silakan hubungi administrator.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 pb-24 sm:pb-28">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Pilih Kategori
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-4 sm:mb-6 leading-tight">
            Pilih Kategori
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pemilihan Anda
            </span>
          </h1>
          <p className="text-slate-700 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Pilih kategori pemilihan yang ingin Anda ikuti. Setiap kategori ada penghitungan yang berbeda.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categories.map((category, index) => {
            const isVoted = votedCategoryIds.has(category.id)
            return (
              <Link
                key={category.id}
                href={`/voter/vote?qrcode=${qrCode}&category=${category.id}`}
                className={`group relative rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 transform hover:-translate-y-2 ${
                  isVoted
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400'
                    : 'bg-white border-gray-200 hover:border-blue-400'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl transition-opacity duration-300 ${
                  isVoted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 opacity-100'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100'
                }`}></div>
                
                {/* Voted Badge */}
                {isVoted && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-2 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Decorative Background Pattern */}
                <div className={`absolute inset-0 transition-opacity ${
                  isVoted ? 'opacity-10' : 'opacity-5 group-hover:opacity-10'
                }`}>
                  <div className={`absolute top-4 right-4 w-20 h-20 rounded-full blur-3xl ${
                    isVoted ? 'bg-green-400' : 'bg-blue-500'
                  }`}></div>
                  <div className={`absolute bottom-4 left-4 w-16 h-16 rounded-full blur-2xl ${
                    isVoted ? 'bg-emerald-400' : 'bg-purple-500'
                  }`}></div>
                </div>

                <div className="relative flex flex-col items-center text-center">
                  {/* Icon Container */}
                  <div className="relative mb-5 sm:mb-6">
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 ${
                      isVoted
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 opacity-30'
                        : 'bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 group-hover:opacity-50'
                    }`}></div>
                    
                    {/* Icon */}
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 ${
                      isVoted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 scale-105'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-110 group-hover:rotate-3'
                    }`}>
                      {category.icon_url ? (
                        <Image
                          src={category.icon_url}
                          alt={category.name}
                          width={64}
                          height={64}
                          className="rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-4xl sm:text-5xl">📊</span>
                      )}
                    </div>
                    
                    {/* Badge Number */}
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                      isVoted
                        ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                        : 'bg-gradient-to-br from-orange-400 to-pink-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Category Name */}
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 transition-all duration-300 ${
                    isVoted
                      ? 'text-green-700'
                      : 'text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600'
                  }`}>
                    {category.name}
                  </h3>

                  {/* Description */}
                  {category.description && (
                    <p className={`text-sm sm:text-base line-clamp-2 mb-4 leading-relaxed ${
                      isVoted ? 'text-slate-700' : 'text-slate-600'
                    }`}>
                      {category.description}
                    </p>
                  )}

                  {/* CTA Button */}
                  <div className="mt-auto w-full">
                    {isVoted ? (
                      <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-sm sm:text-base">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Sudah Vote</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-sm sm:text-base group-hover:gap-3 transition-all duration-300">
                        <span>Mulai Voting</span>
                        <svg 
                          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Shine Effect */}
                {!isVoted && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine pointer-events-none"></div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Info Box */}
        {categories.length > 0 && (
          <div className="mt-12 sm:mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-slate-800 font-semibold">
                Pilih salah satu kategori di atas untuk memulai voting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
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

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <CategoriesPageContent />
    </Suspense>
  )
}

