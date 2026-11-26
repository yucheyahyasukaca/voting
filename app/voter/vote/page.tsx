'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { normalizeQRCode } from '@/lib/qrcode-utils'
import { getCandidateRole } from '@/lib/utils'
import VoterHeader from '@/components/voter/VoterHeader'
import CandidatePhoto from '@/components/voter/CandidatePhoto'
import CandidateSheet, { SheetCandidate } from '@/components/voter/CandidateSheet'

interface Candidate extends SheetCandidate {
  order_index?: number
}

interface Election {
  id: string
  title: string
}

interface Category {
  id: string
  name: string
  description?: string | null
}

function VotePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrCodeRaw = searchParams.get('qrcode')
  const qrCode = qrCodeRaw ? normalizeQRCode(qrCodeRaw) : null
  const categoryId = searchParams.get('category')

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [election, setElection] = useState<Election | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [chosenCandidateId, setChosenCandidateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<Candidate | null>(null)
  const [showFullDesc, setShowFullDesc] = useState(false)

  const hasVoted = chosenCandidateId !== null

  useEffect(() => {
    if (!qrCode || !categoryId) {
      setError('Parameter tidak valid')
      setLoading(false)
      return
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCode, categoryId])

  const loadData = async () => {
    setLoading(true)
    setChosenCandidateId(null)
    setError(null)
    setSubmittingId(null)
    setDetail(null)
    setShowFullDesc(false)

    try {
      const { data: session, error: sessionError } = await supabase
        .from('vt_voting_sessions')
        .select('election_id, qr_code')
        .eq('qr_code', qrCode!)
        .single()

      if (sessionError || !session) {
        setError('Sesi voting tidak valid')
        return
      }

      const { data: electionData, error: electionError } = await supabase
        .from('vt_elections')
        .select('id, title')
        .eq('id', session.election_id)
        .single()

      if (electionError || !electionData) {
        setError('Pemilihan tidak ditemukan')
        return
      }
      setElection(electionData)

      const { data: allCategories } = await supabase
        .from('vt_categories')
        .select('id, name, description')
        .eq('election_id', session.election_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      const current = allCategories?.find((c) => c.id === categoryId)
      if (!current) {
        setError('Kategori tidak ditemukan')
        return
      }
      setCategories(allCategories || [])
      setCategory(current)

      const { data: candidatesData, error: candidatesError } = await supabase
        .from('vt_candidates')
        .select('*')
        .eq('election_id', session.election_id)
        .order('order_index', { ascending: true })

      if (candidatesError) {
        setError('Gagal memuat kandidat')
        return
      }
      setCandidates(candidatesData || [])

      const { data: userVotes } = await supabase
        .from('vt_votes')
        .select('id, candidate_id, category_id')
        .eq('election_id', session.election_id)
        .eq('voter_token', session.qr_code)

      setVotedIds(new Set(userVotes?.map((v) => v.category_id) || []))
      const mine = userVotes?.find((v) => v.category_id === categoryId)
      if (mine?.candidate_id) setChosenCandidateId(mine.candidate_id)
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  /** Setelah suara tersimpan: langsung ke kategori berikutnya, atau ke ringkasan bila semua selesai. */
  const goNext = (voted: Set<string>) => {
    const next = categories.find((c) => !voted.has(c.id))
    if (next) {
      router.push(`/voter/vote?qrcode=${qrCode}&category=${next.id}`)
    } else {
      router.push(`/voter/success?election=${election?.id}&qrcode=${qrCode}&category=${categoryId}`)
    }
  }

  const handleChoose = async (candidate: SheetCandidate) => {
    if (!qrCode || !election || !categoryId || hasVoted || submittingId) return
    setSubmittingId(candidate.id)
    setError(null)

    try {
      const { data: session, error: sessionError } = await supabase
        .from('vt_voting_sessions')
        .select('election_id, qr_code')
        .eq('qr_code', qrCode)
        .single()

      if (sessionError || !session) {
        setError('Sesi voting tidak valid')
        setSubmittingId(null)
        return
      }

      const { error: insertError } = await supabase.from('vt_votes').insert({
        election_id: session.election_id,
        category_id: categoryId,
        candidate_id: candidate.id,
        voter_token: session.qr_code,
      })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Anda sudah memberikan suara untuk kategori ini.')
          await loadData()
        } else {
          setError('Gagal memberikan suara: ' + (insertError.message || 'Silakan coba lagi.'))
          setSubmittingId(null)
        }
        return
      }

      const updated = new Set(votedIds)
      updated.add(categoryId)
      setVotedIds(updated)
      setDetail(null)
      goNext(updated)
    } catch (err: any) {
      console.error('Vote submission error:', err)
      setError('Terjadi kesalahan: ' + (err.message || 'Silakan coba lagi.'))
      setSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jt-paper">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-jt-line border-t-jt-ink" />
      </div>
    )
  }

  if (error && candidates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jt-paper px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-jt-ink text-2xl text-jt-gold">!</div>
          <h1 className="mb-2 text-xl font-extrabold text-jt-ink">Terjadi kesalahan</h1>
          <p className="mb-6 text-[15px] text-jt-muted">{error}</p>
          <button onClick={() => router.back()} className="h-12 rounded-xl bg-jt-ink px-6 font-bold text-white">
            Kembali
          </button>
        </div>
      </div>
    )
  }

  const total = categories.length
  const position = category ? categories.findIndex((c) => c.id === category.id) + 1 : 0
  const nextUnvoted = categories.find((c) => !votedIds.has(c.id)) || null
  const description = category?.description?.replace(/^"|"$/g, '') || ''
  const longDesc = description.length > 140

  return (
    <div className="min-h-screen bg-jt-paper pb-24 text-jt-ink">
      <VoterHeader
        qrCode={qrCode}
        electionId={election?.id}
        backHref={`/voter/categories?qrcode=${qrCode}`}
        backLabel="Daftar kategori"
      />

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {/* Progres kategori */}
        {total > 0 ? (
          <div className="mb-5">
            <div className="flex items-baseline justify-between text-xs font-bold uppercase tracking-wider text-jt-muted">
              <span>Kategori {position} dari {total}</span>
              <span>{votedIds.size} selesai</span>
            </div>
            <div className="mt-2 flex gap-1.5" aria-hidden>
              {categories.map((c) => (
                <span
                  key={c.id}
                  className={`h-1.5 flex-1 rounded-full ${
                    votedIds.has(c.id) ? 'bg-jt-ok' : c.id === category?.id ? 'bg-jt-gold' : 'bg-jt-line'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}

        <h1 className="text-3xl font-black leading-tight tracking-tight">{category?.name}</h1>
        {description ? (
          <div className="mt-2">
            <p className={`text-[15px] leading-relaxed text-jt-muted ${showFullDesc ? '' : 'line-clamp-3'}`}>{description}</p>
            {longDesc ? (
              <button
                onClick={() => setShowFullDesc((v) => !v)}
                className="mt-1 text-sm font-bold text-jt-ink underline decoration-jt-gold decoration-2 underline-offset-4"
              >
                {showFullDesc ? 'Sembunyikan' : 'Selengkapnya'}
              </button>
            ) : null}
          </div>
        ) : null}

        <p className="mt-5 text-[15px]">
          {hasVoted ? (
            <span className="font-bold text-jt-ok">Pilihan Anda sudah tersimpan dan tidak dapat diubah.</span>
          ) : (
            <>
              Pilih <span className="font-bold">satu</span> kandidat. Ketuk kartu untuk melihat profil.
            </>
          )}
        </p>

        {/* Daftar kandidat */}
        <ul className="mt-4 space-y-3">
          {candidates.map((candidate) => {
            const isChosen = chosenCandidateId === candidate.id
            const dimmed = hasVoted && !isChosen
            const role = getCandidateRole(candidate.description)
            const busy = submittingId === candidate.id
            return (
              <li key={candidate.id}>
                <div
                  className={`flex items-stretch gap-3 rounded-2xl border bg-white p-3 transition ${
                    isChosen ? 'border-jt-ok ring-1 ring-jt-ok' : 'border-jt-line'
                  } ${dimmed ? 'opacity-45' : ''}`}
                >
                  <button
                    onClick={() => setDetail(candidate)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-label={`Lihat profil ${candidate.name}`}
                  >
                    <CandidatePhoto
                      name={candidate.name}
                      src={candidate.photo_url}
                      className="h-24 w-20 shrink-0 rounded-xl"
                      sizes="80px"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-extrabold leading-snug">{candidate.name}</h3>
                      {role ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-jt-muted">{role}</p> : null}
                      <p className="mt-1.5 text-xs font-semibold text-jt-ink/70 underline decoration-jt-gold decoration-2 underline-offset-4">
                        Lihat profil
                      </p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center">
                    {isChosen ? (
                      <span className="flex h-11 items-center gap-1 rounded-xl bg-jt-ok px-3 text-sm font-bold text-white">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Dipilih
                      </span>
                    ) : (
                      <button
                        onClick={() => handleChoose(candidate)}
                        disabled={hasVoted || submittingId !== null}
                        className="h-11 min-w-[72px] rounded-xl bg-jt-ink px-4 text-sm font-bold text-white active:bg-jt-ink2 disabled:opacity-40"
                      >
                        {busy ? '…' : 'Pilih'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 flex items-center gap-2 text-xs text-jt-muted">
          <svg className="h-4 w-4 text-jt-ok" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.6-4a12 12 0 01-8.6 3A12 12 0 013 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-2-.4-3z" />
          </svg>
          Suara Anda bersifat rahasia dan aman.
        </p>
      </main>

      {/* Setelah memilih: lanjut manual jika pengguna kembali ke kategori yang sudah dipilih */}
      {hasVoted ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-jt-line bg-jt-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            {nextUnvoted ? (
              <Link
                href={`/voter/vote?qrcode=${qrCode}&category=${nextUnvoted.id}`}
                className="flex h-14 w-full items-center justify-between rounded-2xl bg-jt-ink px-5 text-base font-extrabold text-white"
              >
                <span className="truncate">Lanjut: {nextUnvoted.name}</span>
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <Link
                href={`/voter/success?election=${election?.id}&qrcode=${qrCode}&category=${categoryId}`}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-jt-ok text-base font-extrabold text-white"
              >
                Semua selesai — lihat ringkasan
              </Link>
            )}
          </div>
        </div>
      ) : null}

      <CandidateSheet
        candidate={detail}
        onClose={() => setDetail(null)}
        onChoose={hasVoted ? undefined : handleChoose}
        choosing={submittingId !== null}
        chosen={detail ? chosenCandidateId === detail.id : false}
        categoryName={category?.name}
      />

      {error ? (
        <div role="alert" className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
        </div>
      ) : null}
    </div>
  )
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-jt-paper">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-jt-line border-t-jt-ink" />
        </div>
      }
    >
      <VotePageContent />
    </Suspense>
  )
}
