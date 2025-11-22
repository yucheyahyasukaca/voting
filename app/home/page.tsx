'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-mock'
import Link from 'next/link'
import Image from 'next/image'

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

export default function HomePage() {
  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState({ hours: 12, minutes: 25, seconds: 45 })
  const [voterName] = useState('Jaclyn Lim')

  useEffect(() => {
    loadElectionData()
  }, [])

  useEffect(() => {
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

    return () => clearInterval(interval)
  }, [])

  const loadElectionData = async () => {
    try {
      const { data: elections } = await supabase
        .from('elections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (elections && elections.length > 0) {
        const activeElection = elections[0]
        setElection(activeElection)

        const { data: candidatesData } = await supabase
          .from('candidates')
          .select('*')
          .eq('election_id', activeElection.id)
          .order('order_index', { ascending: true })

        setCandidates(candidatesData || [])
      }
    } catch (err) {
      console.error('Error loading election:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-white">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl">Tidak ada pemilihan aktif saat ini</p>
        </div>
      </div>
    )
  }

  const titleMatch = election.title.match(/(\d+)/)
  const titleNumber = titleMatch ? titleMatch[1] : '2025'
  const titleText = election.title.replace(/\d+.*/, '').trim() || 'Pilih Pejabat Favorit Anda'

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">DISDIKBUD</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-300">Panitia Pemilihan</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/home" className="text-white border-b-2 border-white pb-1">
              Beranda
            </Link>
            <Link href="/nominees" className="text-gray-400 hover:text-white transition">
              Kandidat
            </Link>
            <Link href={`/voter/results?election=${election.id}`} className="text-gray-400 hover:text-white transition">
              Hasil Live
            </Link>
          </nav>

          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium">
            Butuh bantuan?
          </button>
        </div>
      </header>

      <div className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          {election.hero_banner_url ? (
            <Image
              src={election.hero_banner_url}
              alt="Background"
              fill
              className="object-cover opacity-30"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900"></div>
          )}
          <div className="absolute inset-0 bg-black/60"></div>
          
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
            <svg className="absolute top-0 right-0 w-full h-full opacity-20" viewBox="0 0 1200 800">
              <path d="M800 200 L1000 100 L1100 300 L900 400 Z" fill="#3b82f6" />
              <path d="M600 500 L800 400 L900 600 L700 700 Z" fill="#60a5fa" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-6 mb-8">
                <div>
                  <h1 className="text-7xl md:text-8xl font-bold text-yellow-400 leading-none mb-2">
                    {titleNumber}
                  </h1>
                  <p className="text-3xl md:text-4xl font-semibold text-white mt-2">
                    {titleText}
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="w-16 h-16 bg-yellow-400 rounded flex items-center justify-center">
                    <span className="text-yellow-900 font-bold text-sm">2025</span>
                  </div>
                  <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">02/12</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-gray-300 text-sm mb-2">Waktu Tersisa</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-4xl font-bold">{String(timeRemaining.hours).padStart(2, '0')}</p>
                    <p className="text-sm text-gray-400">Jam</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</p>
                    <p className="text-sm text-gray-400">Menit</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</p>
                    <p className="text-sm text-gray-400">Detik</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-1">
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">🗳️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-2xl p-6 mt-8 max-w-4xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Halo {voterName} 👋
                </h2>
                <p className="text-gray-600">
                  Saatnya untuk menyuarakan pendapat Anda.
                </p>
              </div>

              <div className="flex-shrink-0">
                <Link
                  href="/"
                  className="relative inline-flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl group"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-lg">Berikan Suara Anda Sekarang</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </span>
                      <span className="text-sm font-normal opacity-90">Voting sedang dibuka</span>
                    </div>
                  </div>
                  <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white text-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-2">
            Kenali Para Kandidat
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Kenali profil kandidat & buat keputusan yang tepat.
          </p>

          {candidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {candidates.slice(0, 3).map((candidate) => (
                <div key={candidate.id} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
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
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {candidate.name}
                  </h3>
                  {candidate.description && (
                    <p className="text-sm text-gray-600">{candidate.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Belum ada kandidat yang terdaftar</p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>fpam.org.my</p>
        </div>
      </footer>
    </div>
  )
}

