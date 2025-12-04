'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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

function VoterPageContent() {
  const searchParams = useSearchParams()
  const qrCode = searchParams.get('qrcode')
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voterName] = useState('Jaclyn Lim')
  const [timeRemaining, setTimeRemaining] = useState({ hours: 12, minutes: 25, seconds: 44 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    if (!qrCode) {
      setError('QR Code tidak valid')
      setLoading(false)
      return
    }

    loadElectionData()
  }, [qrCode])

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

  const loadElectionData = async () => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('election_id, is_active, expires_at')
        .eq('qr_code', qrCode!)
        .single()

      if (sessionError || !session || !session.is_active) {
        setError('QR Code tidak valid atau sudah tidak aktif')
        setLoading(false)
        return
      }

      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        setError('QR Code sudah kadaluarsa')
        setLoading(false)
        return
      }

      // Load election tanpa filter is_active dulu, untuk cek error lebih jelas
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', session.election_id)
        .single()

      if (electionError) {
        console.error('Error loading election:', electionError)
        setError('Gagal memuat data pemilihan: ' + electionError.message)
        setLoading(false)
        return
      }

      if (!electionData) {
        setError('Pemilihan tidak ditemukan')
        setLoading(false)
        return
      }

      // Cek apakah election aktif
      if (!electionData.is_active) {
        setError('Pemilihan saat ini tidak aktif. Silakan hubungi administrator untuk mengaktifkan pemilihan.')
        setLoading(false)
        return
      }

      setElection(electionData)

      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionData.id)
        .order('order_index', { ascending: true })

      if (candidatesError) {
        setError('Gagal memuat kandidat')
        setLoading(false)
        return
      }

      setCandidates(candidatesData || [])
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Memuat...</p>
        </div>
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-400 mb-6">{error || 'Pemilihan tidak ditemukan'}</p>
          <Link href="/" className="text-blue-400 hover:underline">
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    )
  }

  // Extract number from title
  const titleMatch = election.title.match(/(\d+)/)
  const titleNumber = titleMatch ? titleMatch[1] : '2025'

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-black border-b border-gray-800 relative z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">JATENG</span>
              <span className="text-gray-500">|</span>
              <span className="text-white text-sm font-medium">Pilih Pejabat Favorit</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-6">
                <Link href={`/voter?qrcode=${qrCode}`} className="text-white text-sm font-medium pb-1 border-b-2 border-white">
                  Beranda
                </Link>
                <Link href={`/voter?qrcode=${qrCode}&view=nominees`} className="text-gray-400 hover:text-white text-sm font-medium">
                  Kandidat
                </Link>
                <Link href={`/voter/results?election=${election.id}`} className="text-gray-400 hover:text-white text-sm font-medium">
                  Hasil Live
                </Link>
              </div>
              
              {/* Desktop Help Button */}
              <button className="hidden md:block px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100">
                Butuh bantuan?
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 animate-fadeIn">
              <div className="flex flex-col gap-3">
                <Link
                  href={`/voter?qrcode=${qrCode}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-base font-medium py-3 px-4 hover:bg-gray-800 rounded-lg transition-colors border-l-4 border-white bg-gray-900/50"
                >
                  Beranda
                </Link>
                <Link
                  href={`/voter?qrcode=${qrCode}&view=nominees`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white text-base font-medium py-3 px-4 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Kandidat
                </Link>
                <Link
                  href={`/voter/results?election=${election.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white text-base font-medium py-3 px-4 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Hasil Live
                </Link>
                <button className="w-full mt-2 px-4 py-3 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
                  Butuh bantuan?
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-indigo-950/15 to-purple-950/10 animate-gradient"></div>
        
        {/* Background Image with Modern Overlay */}
        <div className="absolute inset-0">
          {election.hero_banner_url ? (
            <div className="relative w-full h-full">
              <Image
                src={election.hero_banner_url}
                alt="Banner"
                fill
                className="object-cover opacity-10"
                style={{ filter: 'blur(12px) brightness(0.4)' }}
              />
            </div>
          ) : null}
        </div>

        {/* Modern Mesh Gradient Overlay - Darker */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.12),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"></div>

        {/* Modern Grid Pattern - Darker */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Animated Blue Abstract Shape - Modern Design - Darker */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 500 600"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M 0 0 L 250 200 L 0 400 L 500 600 L 500 0 Z"
              fill="url(#blueGradient)"
            />
            <path
              d="M 0 100 L 200 250 L 0 500 L 500 600 L 500 100 Z"
              fill="url(#blueGradient)"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Animated Orbs/Blobs - Darker */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Content */}
        <div className="relative z-10 px-4 py-12 sm:py-16 md:py-20 min-h-[500px] sm:min-h-[600px] md:min-h-[650px] flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
              {/* Left Side - Main Content */}
              <div className="lg:col-span-7">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8">
                  {/* Number "2025" */}
                  <div className="flex-shrink-0">
                    <h1 className="text-[80px] sm:text-[100px] md:text-[140px] lg:text-[160px] font-black leading-none text-yellow-400 text-center md:text-left" style={{ letterSpacing: '-0.03em' }}>
                      {titleNumber}
                    </h1>
                  </div>

                  {/* Title Lines - 1 baris */}
                  <div className="flex items-center mt-0 md:mt-2">
                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white uppercase leading-tight text-center md:text-left whitespace-nowrap">
                      PILIH PEJABAT FAVORIT ANDA
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Time Remaining */}
              <div className="lg:col-span-5 flex items-center justify-center mt-8 lg:mt-0">
                <div className="text-white text-center w-full">
                  <h3 className="text-xs sm:text-sm md:text-base font-medium mb-4 sm:mb-6 text-gray-300">Waktu Tersisa</h3>
                  <div className="flex items-baseline gap-2 sm:gap-4 md:gap-6 justify-center flex-wrap">
                    <div className="min-w-[60px] sm:min-w-[80px]">
                      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-none">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs sm:text-sm md:text-base text-white mt-1 sm:mt-2">Jam</div>
                    </div>
                    <div className="min-w-[60px] sm:min-w-[80px]">
                      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-none">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs sm:text-sm md:text-base text-white mt-1 sm:mt-2">Menit</div>
                    </div>
                    <div className="min-w-[60px] sm:min-w-[80px]">
                      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-none">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs sm:text-sm md:text-base text-white mt-1 sm:mt-2">Detik</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* White Card Overlap */}
      <div className="relative z-20 -mt-12 sm:-mt-16 md:-mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
              {/* Left - Greeting */}
              <div className="flex-1 w-full md:w-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-2 sm:mb-3">
                  {greeting} 👋
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  Saatnya untuk memilih pejabat favorit anda
                </p>
              </div>

              {/* Right - Button */}
              <div className="w-full md:w-auto flex flex-col items-start md:items-end">
                <Link
                  href={`/voter/categories?qrcode=${qrCode}`}
                  className="group relative inline-flex items-center justify-between gap-3 sm:gap-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl transition-all shadow-lg w-full md:w-auto text-center"
                >
                  <span className="text-base sm:text-lg md:text-xl">Berikan Suara Anda Sekarang</span>
                  <span className="text-lg sm:text-xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <div className="flex items-center gap-2 mt-2 sm:mt-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-bold text-red-500 uppercase">LIVE</span>
                  <span className="text-xs sm:text-sm text-black">Voting sedang dibuka</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meet the Nominees Section */}
      <div className="bg-white px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Kenali Para Kandidat
            </h3>
            <p className="text-gray-600 text-lg">
              Kenali profil kandidat & buat keputusan yang tepat.
            </p>
          </div>

          {candidates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {candidates.slice(0, 3).map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/voter?qrcode=${qrCode}&view=nominees`}
                  className="text-center group"
                >
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-200 group-hover:border-blue-500 transition-colors">
                    {candidate.photo_url ? (
                      <Image
                        src={candidate.photo_url}
                        alt={candidate.name}
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl">👤</span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg text-black group-hover:text-blue-600 transition-colors">
                    {candidate.name}
                  </h4>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="text-center">
          <a 
            href="https://garuda-21.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            GARUDA-21.com Sekolah Digital
          </a>
        </div>
      </div>
    </div>
  )
}

export default function VoterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Memuat...</p>
        </div>
      </div>
    }>
      <VoterPageContent />
    </Suspense>
  )
}
