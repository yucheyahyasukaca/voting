'use client'

import { useEffect } from 'react'
import CandidatePhoto from './CandidatePhoto'
import { parseCandidateProfile } from '@/lib/utils'

export interface SheetCandidate {
  id: string
  name: string
  description: string | null
  photo_url: string | null
}

interface Props {
  candidate: SheetCandidate | null
  onClose: () => void
  /** Jika ada, tombol "Pilih" ditampilkan. */
  onChoose?: (candidate: SheetCandidate) => void
  choosing?: boolean
  /** Kandidat ini sudah dipilih voter di kategori ini. */
  chosen?: boolean
  categoryName?: string
}

export default function CandidateSheet({ candidate, onClose, onChoose, choosing, chosen, categoryName }: Props) {
  useEffect(() => {
    if (!candidate) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [candidate, onClose])

  if (!candidate) return null
  const { rows, notes } = parseCandidateProfile(candidate.description)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Profil ${candidate.name}`}>
      <button aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-jt-ink/70" />
      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-jt-paper sm:max-w-md sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-jt-line sm:hidden" />

        <div className="overflow-y-auto overscroll-contain px-5 pb-4 pt-4">
          <div className="flex items-start gap-4">
            <CandidatePhoto
              name={candidate.name}
              src={candidate.photo_url}
              className="h-28 w-24 shrink-0 rounded-2xl"
              sizes="96px"
              priority
            />
            <div className="min-w-0 flex-1 pt-1">
              {categoryName ? (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-jt-muted">{categoryName}</p>
              ) : null}
              <h2 className="text-xl font-extrabold leading-tight text-jt-ink">{candidate.name}</h2>
              {chosen ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-jt-ok px-2.5 py-1 text-xs font-bold text-white">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Pilihan Anda
                </span>
              ) : null}
            </div>
          </div>

          {rows.length > 0 ? (
            <dl className="mt-5 divide-y divide-jt-line rounded-2xl border border-jt-line bg-white">
              {rows.map((r) => (
                <div key={r.label} className="px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-jt-muted">{r.label}</dt>
                  <dd className="mt-0.5 text-[15px] font-medium leading-snug text-jt-ink">{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {notes.length > 0 ? (
            <div className="mt-4 space-y-2 text-[15px] leading-relaxed text-jt-ink/80">
              {notes.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          ) : null}

          {rows.length === 0 && notes.length === 0 ? (
            <p className="mt-5 text-sm text-jt-muted">Belum ada profil untuk kandidat ini.</p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-jt-line bg-jt-paper px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {onChoose && !chosen ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="h-12 rounded-xl border border-jt-line bg-white px-5 text-[15px] font-semibold text-jt-ink active:bg-jt-line"
              >
                Tutup
              </button>
              <button
                onClick={() => onChoose(candidate)}
                disabled={choosing}
                className="h-12 flex-1 rounded-xl bg-jt-ink text-[15px] font-bold text-white active:bg-jt-ink2 disabled:opacity-60"
              >
                {choosing ? 'Menyimpan…' : 'Pilih kandidat ini'}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="h-12 w-full rounded-xl bg-jt-ink text-[15px] font-bold text-white active:bg-jt-ink2"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
