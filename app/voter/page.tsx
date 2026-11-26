'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { getElectionYear } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import VoterHeader from '@/components/voter/VoterHeader'
import CandidatePhoto from '@/components/voter/CandidatePhoto'
import CandidateSheet, { SheetCandidate } from '@/components/voter/CandidateSheet'
import { getCandidateRole } from '@/lib/utils'
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
  const [timeRemaining, setTimeRemaining] = useState({ hours: 12, minutes: 25, seconds: 44 })
  const [selected, setSelected] = useState<SheetCandidate | null>(null)
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
        .from('vt_voting_sessions')
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
        .from('vt_elections')
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
        .from('vt_candidates')
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
      <div className="flex min-h-screen items-center justify-center bg-jt-paper">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-jt-line border-t-jt-ink" />
          <p className="mt-4 text-sm text-jt-muted">Memuat…</p>
        </div>
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jt-paper px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-jt-ink text-2xl text-jt-gold">!</div>
          <h1 className="mb-2 text-xl font-extrabold text-jt-ink">Tidak dapat membuka voting</h1>
          <p className="text-[15px] leading-relaxed text-jt-muted">{error || 'Pemilihan tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

  const year = getElectionYear(election)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="min-h-screen bg-jt-paper text-jt-ink">
      <VoterHeader qrCode={qrCode} electionId={election.id} />

      {/* Hero */}
      <section className="bg-jt-ink text-white">
        <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-jt-gold">Pemilihan {year}</p>
          <h1 className="mt-3 text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-6xl">
            {election.title}
          </h1>
          {election.description ? (
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">{election.description}</p>
          ) : null}

          <div className="mt-8">
            <p className="mb-3 text-xs font-medium text-white/60">Waktu tersisa</p>
            <div className="flex items-start gap-2 font-black tabular-nums sm:gap-3">
              {[
                { v: timeRemaining.hours, l: 'Jam' },
                { v: timeRemaining.minutes, l: 'Menit' },
                { v: timeRemaining.seconds, l: 'Detik' },
              ].map((u, i) => (
                <div key={u.l} className="flex items-start gap-2 sm:gap-3">
                  {i > 0 ? <span className="pt-1 text-3xl text-jt-gold sm:text-5xl">:</span> : null}
                  <div className="text-center">
                    <div className="min-w-[2ch] text-5xl leading-none sm:text-6xl">{pad(u.v)}</div>
                    <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-white/50">{u.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="relative z-10 -mt-14 px-4">
        <div className="mx-auto max-w-5xl rounded-3xl border border-jt-line bg-white p-5 shadow-[0_8px_30px_rgba(11,31,58,0.10)] sm:p-7">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Voting dibuka</span>
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting}</h2>
          <p className="mt-1 text-[15px] text-jt-muted">Saatnya memilih pejabat favorit Anda.</p>
          <Link
            href={`/voter/categories?qrcode=${qrCode}`}
            className="mt-5 flex h-14 w-full items-center justify-between rounded-2xl bg-jt-gold px-5 text-base font-extrabold text-jt-ink active:brightness-95 sm:inline-flex sm:w-auto sm:gap-10"
          >
            <span>Berikan suara sekarang</span>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Kandidat */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-12">
        <div className="mb-5 flex items-end justify-between gap-4 px-1">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Kenali para kandidat</h2>
            <p className="mt-1 text-sm text-jt-muted">Ketuk foto untuk melihat profil lengkap.</p>
          </div>
          <span className="shrink-0 rounded-full bg-jt-ink px-3 py-1 text-xs font-bold text-white">{candidates.length} kandidat</span>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {candidates.map((candidate) => {
            const role = getCandidateRole(candidate.description)
            return (
              <li key={candidate.id}>
                <button
                  onClick={() => setSelected(candidate)}
                  className="group block w-full overflow-hidden rounded-2xl border border-jt-line bg-white text-left transition active:scale-[0.98]"
                >
                  <CandidatePhoto
                    name={candidate.name}
                    src={candidate.photo_url}
                    className="aspect-[4/5] w-full"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">{candidate.name}</h3>
                    {role ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-jt-muted">{role}</p> : null}
                    <p className="mt-2 text-xs font-semibold text-jt-ink underline decoration-jt-gold decoration-2 underline-offset-4">
                      Lihat profil
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <footer className="border-t border-jt-line px-4 py-6 text-center">
        <a
          href="https://garuda-21.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-jt-muted hover:text-jt-ink"
        >
          Powered by GARUDA-21.com
        </a>
      </footer>

      <CandidateSheet candidate={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default function VoterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-jt-paper">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-jt-line border-t-jt-ink" />
        </div>
      }
    >
      <VoterPageContent />
    </Suspense>
  )
}
