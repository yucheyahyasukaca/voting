'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase-mock'
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

      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', session.election_id)
        .eq('is_active', true)
        .single()

      if (electionError || !electionData) {
        setError('Pemilihan tidak ditemukan atau tidak aktif')
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
  const titleNumber = titleMatch ? titleMatch[1] : '23'

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation Bar - Sesuai Referensi */}
      <nav className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">DISDIKBUD</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 text-sm">Panitia Pemilihan</span>
            </div>
            <div className="flex items-center gap-6">
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
              <button className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 border-2 border-gray-300">
                Butuh bantuan?
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Sesuai Referensi */}
      <div className="relative bg-black overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {election.hero_banner_url ? (
            <div className="relative w-full h-full">
              <Image
                src={election.hero_banner_url}
                alt="Banner"
                fill
                className="object-cover opacity-40"
                style={{ filter: 'blur(8px)' }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
          )}
        </div>

        {/* Blue Checkmark Overlay - Large V Shape di kanan */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 500 600"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 0 L 300 300 L 0 600 L 500 600 L 500 0 Z"
              fill="#3B82F6"
              opacity="0.25"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 py-12 min-h-[500px] flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Side - Main Content */}
              <div className="md:col-span-8">
                <div className="flex items-start gap-6">
                  {/* Number "23" */}
                  <div className="flex items-baseline gap-1">
                    <h1 className="text-[140px] md:text-[180px] font-black leading-none text-yellow-400" style={{ letterSpacing: '-0.05em' }}>
                      {titleNumber}
                    </h1>
                    <span className="text-3xl md:text-4xl font-bold text-white uppercase self-start mt-4">
                      RD
                    </span>
                  </div>

                  {/* Title Lines + Badges */}
                  <div className="flex flex-col gap-4 mt-8">
                    {/* Title Text - 3 Lines */}
                    <div>
                      <div className="text-2xl md:text-3xl font-bold text-white uppercase leading-tight">
                        TAHUNAN
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-white uppercase leading-tight">
                        RAPAT
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-white uppercase leading-tight">
                        UMUM
                      </div>
                    </div>

                    {/* Logo Badges - 2 kotak */}
                    <div className="flex gap-2">
                      <div className="w-12 h-12 bg-yellow-400 rounded flex items-center justify-center border-2 border-red-600">
                        <span className="text-xs font-bold text-red-600">DISDIKBUD</span>
                      </div>
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                        <div className="relative w-8 h-8">
                          <svg className="w-full h-full text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Time Remaining */}
              <div className="md:col-span-4">
                <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-white text-sm font-medium mb-6 text-center">Waktu Tersisa</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-1">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-gray-400 text-sm">Jam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-1">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-gray-400 text-sm">Menit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-white mb-1">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-gray-400 text-sm">Detik</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* White Card Overlap - Sesuai Referensi */}
      <div className="relative z-20 -mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Left - Greeting */}
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-bold text-black mb-3">
                  Halo {voterName} 👋
                </h2>
                <p className="text-gray-600 text-lg">
                  Saatnya untuk menyuarakan pendapat Anda.
                </p>
              </div>

              {/* Right - Button */}
              <div className="w-full md:w-auto">
                <Link
                  href={`/voter/vote?qrcode=${qrCode}`}
                  className="group relative inline-flex items-center justify-between gap-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-lg w-full md:w-auto"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xl md:text-2xl mb-2">Berikan Suara Anda Sekarang</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-red-500 px-3 py-1 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                      <span className="text-sm font-normal text-blue-100">Voting sedang dibuka</span>
                    </div>
                  </div>
                  <span className="text-4xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
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
          <p className="text-gray-500 text-sm">disdikbud.org</p>
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
