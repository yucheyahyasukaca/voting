import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateVoterToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}


/**
 * Tahun yang ditampilkan di halaman voter: angka di judul jika ada,
 * kalau tidak, tahun dari tanggal mulai pemilihan, kalau tidak, tahun sekarang.
 */
export function getElectionYear(election?: { title?: string | null; start_date?: string | null } | null): string {
  const fromTitle = election?.title?.match(/(\d+)/)
  if (fromTitle) return fromTitle[1]
  if (election?.start_date) {
    const d = new Date(election.start_date)
    if (!isNaN(d.getTime())) return String(d.getFullYear())
  }
  return String(new Date().getFullYear())
}

export interface CandidateProfileRow {
  label: string
  value: string
}

/**
 * Deskripsi kandidat berformat baris "Label : Nilai".
 * Mengembalikan baris-baris profil (tanpa "Nama", karena sudah jadi judul)
 * dan teks bebas yang tidak berformat itu.
 */
export function parseCandidateProfile(description?: string | null): {
  rows: CandidateProfileRow[]
  notes: string[]
} {
  const rows: CandidateProfileRow[] = []
  const notes: string[] = []
  for (const raw of (description || '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx > 0 && idx < 32) {
      const label = line.slice(0, idx).trim().replace(/\s*\/\s*/g, ' / ')
      const value = line.slice(idx + 1).trim()
      if (!value) continue
      if (label.toLowerCase() === 'nama') continue
      rows.push({ label, value })
    } else {
      notes.push(line)
    }
  }
  return { rows, notes }
}

/** Jabatan singkat untuk daftar kandidat. */
export function getCandidateRole(description?: string | null): string {
  const { rows } = parseCandidateProfile(description)
  const job = rows.find((r) => r.label.toLowerCase().startsWith('jabatan'))
  return job ? job.value : ''
}

export function getInitials(name: string): string {
  return name
    .replace(/[.,].*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}
