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
