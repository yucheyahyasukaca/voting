'use client'

import Link from 'next/link'

interface Props {
  qrCode: string | null
  electionId?: string | null
  /** Tampilkan tautan kembali (mis. ke daftar kategori) */
  backHref?: string
  backLabel?: string
}

const HELP_URL = 'https://wa.me/62811354321?text=Mas%20Yuche%20saya%20ada%20kendala'

export default function VoterHeader({ qrCode, electionId, backHref, backLabel }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-jt-ink text-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel || 'Kembali'}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-white/80 active:bg-white/10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : null}
          <Link href={qrCode ? `/voter?qrcode=${qrCode}` : '/'} className="flex min-w-0 items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-jt-gold" aria-hidden />
            <span className="truncate text-sm font-bold tracking-wide">DISDIK JATENG</span>
            <span className="hidden truncate text-sm text-white/60 sm:inline">· Pilih Pejabat Favorit</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          {electionId ? (
            <Link
              href={`/voter/results?election=${electionId}`}
              className="rounded-full px-3 py-2 font-medium text-white/80 active:bg-white/10 hover:text-white"
            >
              Hasil Live
            </Link>
          ) : null}
          <a
            href={HELP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/25 px-3 py-1.5 font-medium text-white active:bg-white/10"
          >
            Bantuan
          </a>
        </nav>
      </div>
    </header>
  )
}
