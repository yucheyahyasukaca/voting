'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import VoterHeader from '@/components/voter/VoterHeader'

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
        .from('vt_voting_sessions')
        .select('election_id')
        .eq('qr_code', qrCode!)
        .single()

      if (sessionError || !session) {
        setError('Sesi voting tidak valid')
        setLoading(false)
        return
      }

      const { data: electionData, error: electionError } = await supabase
        .from('vt_elections')
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
        .from('vt_categories')
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
        .from('vt_votes')
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
      <div className="flex min-h-screen items-center justify-center bg-jt-paper">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-jt-line border-t-jt-ink" />
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jt-paper px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-jt-ink text-2xl text-jt-gold">!</div>
          <h1 className="mb-2 text-xl font-extrabold text-jt-ink">Terjadi kesalahan</h1>
          <p className="text-[15px] text-jt-muted">{error || 'Pemilihan tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-jt-paper">
        <VoterHeader qrCode={qrCode} electionId={election.id} />
        <div className="mx-auto max-w-sm px-6 py-20 text-center">
          <h1 className="mb-2 text-xl font-extrabold text-jt-ink">Belum ada kategori</h1>
          <p className="text-[15px] text-jt-muted">Hubungi administrator untuk menyiapkan kategori pemilihan.</p>
        </div>
      </div>
    )
  }

  const total = categories.length
  const doneCount = categories.filter((c) => votedCategoryIds.has(c.id)).length
  const nextCategory = categories.find((c) => !votedCategoryIds.has(c.id)) || null
  const allDone = doneCount === total

  return (
    <div className="min-h-screen bg-jt-paper pb-28 text-jt-ink">
      <VoterHeader qrCode={qrCode} electionId={election.id} backHref={`/voter?qrcode=${qrCode}`} backLabel="Kembali ke beranda" />

      <main className="mx-auto max-w-3xl px-4 pt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jt-muted">Langkah voting</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Pilih kategori</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-jt-muted">
          Setiap kategori dinilai terpisah. Anda memberikan satu suara di tiap kategori.
        </p>

        {/* Progres */}
        <div className="mt-5 rounded-2xl border border-jt-line bg-white p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold">{doneCount} dari {total} kategori selesai</span>
            <span className="text-sm tabular-nums text-jt-muted">{Math.round((doneCount / total) * 100)}%</span>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {categories.map((c) => (
              <span
                key={c.id}
                className={`h-1.5 flex-1 rounded-full ${votedCategoryIds.has(c.id) ? 'bg-jt-ok' : 'bg-jt-line'}`}
              />
            ))}
          </div>
        </div>

        <ol className="mt-5 space-y-3">
          {categories.map((category, index) => {
            const isVoted = votedCategoryIds.has(category.id)
            const isNext = nextCategory?.id === category.id
            return (
              <li key={category.id}>
                <Link
                  href={`/voter/vote?qrcode=${qrCode}&category=${category.id}`}
                  className={`flex items-start gap-4 rounded-2xl border bg-white p-4 transition active:scale-[0.99] ${
                    isNext ? 'border-jt-ink ring-1 ring-jt-ink' : 'border-jt-line'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black ${
                      isVoted ? 'bg-jt-ok text-white' : isNext ? 'bg-jt-gold text-jt-ink' : 'bg-jt-paper text-jt-muted'
                    }`}
                  >
                    {isVoted ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-extrabold leading-snug">{category.name}</h3>
                    {category.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-jt-muted">
                        {category.description.replace(/^"|"$/g, '')}
                      </p>
                    ) : null}
                    <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${isVoted ? 'text-jt-ok' : 'text-jt-ink'}`}>
                      {isVoted ? 'Sudah dipilih' : isNext ? 'Giliran Anda →' : 'Belum dipilih'}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>
      </main>

      {/* Aksi utama */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-jt-line bg-jt-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          {allDone ? (
            <Link
              href={`/voter/success?election=${election.id}&qrcode=${qrCode}`}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-jt-ok text-base font-extrabold text-white"
            >
              Semua selesai — lihat ringkasan
            </Link>
          ) : (
            <Link
              href={`/voter/vote?qrcode=${qrCode}&category=${nextCategory!.id}`}
              className="flex h-14 w-full items-center justify-between rounded-2xl bg-jt-ink px-5 text-base font-extrabold text-white active:bg-jt-ink2"
            >
              <span className="truncate">{doneCount === 0 ? 'Mulai' : 'Lanjutkan'}: {nextCategory!.name}</span>
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-jt-paper">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-jt-line border-t-jt-ink" />
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  )
}
