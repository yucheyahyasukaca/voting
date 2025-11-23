'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { getVotingUrl } from '@/lib/app-url'
import Image from 'next/image'
import QRCode from '@/components/QRCode'

interface Election {
  id: string
  title: string
  description: string
  hero_banner_url: string | null
  start_date: string
  end_date: string
  is_active: boolean
  allow_view_results: boolean
}

interface Candidate {
  id: string
  name: string
  description: string
  photo_url: string | null
  order_index: number
}

interface VotingSession {
  id: string
  qr_code: string
  is_active: boolean
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  order_index: number
  is_active: boolean
}

export default function ElectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string

  const [election, setElection] = useState<Election | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null)
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'candidates' | 'qr' | 'results'>('categories')
  const [qrCount, setQrCount] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [currentQrPage, setCurrentQrPage] = useState(1)
  const [qrItemsPerPage] = useState(9) // 3x3 grid (or 1x3 on mobile)

  useEffect(() => {
    loadData()
  }, [electionId])

  const loadData = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true)
      }

      // Load election
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single()

      if (electionError || !electionData) {
        alert('Pemilihan tidak ditemukan')
        router.push('/admin')
        return
      }

      setElection(electionData)

      // Load candidates
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true })

      setCandidates(candidatesData || [])

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true })

      setCategories(categoriesData || [])

      // Load voting sessions (all active)
      // Note: We only load active sessions, deleted sessions won't appear
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('election_id', electionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (sessionsError) {
        console.error('Error loading voting sessions:', sessionsError)
        setVotingSessions([])
        setVotingSession(null)
      } else if (sessionsData && sessionsData.length > 0) {
        console.log('Loaded voting sessions:', sessionsData.length)
        setVotingSessions(sessionsData)
        setVotingSession(sessionsData[0]) // Set first one as default for backward compatibility
      } else {
        console.log('No voting sessions found')
        setVotingSessions([])
        setVotingSession(null)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      if (!skipLoading) {
        setLoading(false)
      }
    }
  }

  const generateQRCode = async () => {
    if (qrCount < 1 || qrCount > 1000) {
      alert('Jumlah QR code harus antara 1-1000')
      return
    }

    setGenerating(true)
    try {
      // Get existing QR codes to ensure we don't create duplicates
      const { data: existingSessions } = await supabase
        .from('voting_sessions')
        .select('qr_code')
        .eq('election_id', electionId)
        .eq('is_active', true)

      const existingQRCodes = new Set(existingSessions?.map(s => s.qr_code) || [])

      // Generate multiple QR codes
      const sessionsToInsert = []
      let attempts = 0
      const maxAttempts = qrCount * 10 // Limit attempts to prevent infinite loop

      for (let i = 0; i < qrCount && attempts < maxAttempts; attempts++) {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const qrCode = `voting-${electionId}-${timestamp}-${random}-${i}`
        
        // Ensure unique QR code (prevent duplicates)
        if (!existingQRCodes.has(qrCode)) {
          sessionsToInsert.push({
            election_id: electionId,
            qr_code: qrCode,
            is_active: true,
          })
          existingQRCodes.add(qrCode) // Add to set to prevent duplicates in same batch
          i++ // Only increment when QR code is successfully added
        }
      }

      if (sessionsToInsert.length === 0) {
        alert('Tidak dapat membuat QR code baru. Silakan coba lagi.')
        setGenerating(false)
        return
      }

      // Insert new sessions (only adds new QR codes, does NOT delete existing ones)
      const { data, error } = await supabase
        .from('voting_sessions')
        .insert(sessionsToInsert)
        .select()

      if (error) {
        console.error('Error creating QR codes:', error)
        alert('Gagal membuat QR codes: ' + error.message)
        setGenerating(false)
        return
      }

      // Verify insert was successful
      if (data && data.length > 0) {
        console.log('QR codes created successfully:', data.length)
      } else {
        console.warn('No QR codes were created, but no error occurred')
      }

      const createdCount = data?.length || sessionsToInsert.length
      const currentTotal = votingSessions.length
      const newTotal = currentTotal + createdCount

      // Immediately update state optimistically (add new QR codes to current list)
      const updatedSessions = [...votingSessions, ...(data || [])]
      setVotingSessions(updatedSessions)
      if (votingSessions.length === 0 && updatedSessions.length > 0) {
        setVotingSession(updatedSessions[0])
      }

      // Switch to QR tab immediately for better UX
      setActiveTab('qr')
      
      // Reset to first page when new QR codes are added (so user can see the new ones)
      setCurrentQrPage(1)
      
      // Reset to first page when new QR codes are added (so user can see the new ones)
      setCurrentQrPage(1)
      
      // Wait a bit to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 300))

      // Reload data from database to ensure sync (but state already updated above)
      await loadData(true) // Skip loading state since we already updated UI
      
      alert(`✅ Berhasil menambahkan ${createdCount} QR code baru!\n\nTotal QR code aktif: ${newTotal}\nQR code yang sudah ada tetap aman dan tidak terhapus.`)
    } catch (err: any) {
      console.error('Error generating QR codes:', err)
      alert('Terjadi kesalahan: ' + (err.message || 'Unknown error'))
    } finally {
      setGenerating(false)
    }
  }

  const deactivateAllSessions = async () => {
    if (!confirm('Yakin ingin menonaktifkan semua QR code? QR code yang dinonaktifkan tidak bisa digunakan untuk voting.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('voting_sessions')
        .update({ is_active: false })
        .eq('election_id', electionId)

      if (error) {
        alert('Gagal menonaktifkan QR codes: ' + error.message)
        return
      }

      await loadData()
      alert('Semua QR code berhasil dinonaktifkan')
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err.message || 'Unknown error'))
    }
  }

  const deleteQRCode = async (sessionId: string, qrCodeNumber: number) => {
    if (!confirm(`Yakin ingin menghapus QR Code #${qrCodeNumber}?\n\nTindakan ini akan:\n• Menghapus QR code ini secara permanen\n• QR code ini tidak bisa digunakan untuk voting\n• TIDAK DAPAT DIBATALKAN`)) {
      return
    }

    try {
      // Delete the voting session from database first
      const { data, error } = await supabase
        .from('voting_sessions')
        .delete()
        .eq('id', sessionId)
        .select()

      if (error) {
        console.error('Error deleting QR code:', error)
        alert('Gagal menghapus QR code: ' + (error.message || 'Unknown error'))
        return
      }

      // Check if deletion was successful
      console.log('QR code deletion result:', data)

      // Immediately update state to remove from UI
      const updatedSessions = votingSessions.filter(s => s.id !== sessionId)
      setVotingSessions(updatedSessions)
      
      // Also update votingSession if it was the deleted one
      if (votingSession?.id === sessionId) {
        setVotingSession(updatedSessions.length > 0 ? updatedSessions[0] : null)
      }

      // Adjust current page if we deleted the last item on the current page
      const totalPagesAfterDelete = Math.ceil(updatedSessions.length / qrItemsPerPage)
      if (currentQrPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentQrPage(totalPagesAfterDelete)
      }

      // Wait a bit to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 200))

      // Force reload data from database to ensure sync
      await loadData(true)
      
      alert(`✅ QR Code #${qrCodeNumber} berhasil dihapus!`)
    } catch (err: any) {
      console.error('Error deleting QR code:', err)
      // Reload data to ensure UI is in sync
      await loadData(true)
      alert('Terjadi kesalahan saat menghapus QR code: ' + (err.message || 'Unknown error'))
    }
  }

  const deleteAllQRCodes = async () => {
    if (!votingSessions || votingSessions.length === 0) {
      alert('Tidak ada QR code untuk dihapus')
      return
    }

    const totalCount = votingSessions.length

    // Double confirmation
    const firstConfirm = confirm(
      `⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA QR code?\n\n` +
      `Total QR code yang akan dihapus: ${totalCount}\n\n` +
      `Tindakan ini akan:\n` +
      `• Menghapus SEMUA QR code untuk pemilihan ini\n` +
      `• QR code yang dihapus tidak bisa digunakan untuk voting\n` +
      `• TIDAK DAPAT DIBATALKAN\n\n` +
      `Klik OK untuk melanjutkan atau Cancel untuk membatalkan.`
    )

    if (!firstConfirm) return

    const secondConfirm = confirm(
      `⚠️ KONFIRMASI TERAKHIR!\n\n` +
      `Anda akan menghapus ${totalCount} QR code.\n` +
      `Pastikan ini yang Anda inginkan.\n\n` +
      `Klik OK untuk menghapus semua QR code atau Cancel untuk membatalkan.`
    )

    if (!secondConfirm) return

    try {
      // Optimistically update state (clear UI immediately)
      const previousSessions = [...votingSessions]
      setVotingSessions([])
      setVotingSession(null)
      setCurrentQrPage(1) // Reset to first page

      // Delete all voting sessions for this election
      const { data, error } = await supabase
        .from('voting_sessions')
        .delete()
        .eq('election_id', electionId)
        .select()

      if (error) {
        console.error('Error deleting all QR codes:', error)
        // Revert state on error
        setVotingSessions(previousSessions)
        if (previousSessions.length > 0) {
          setVotingSession(previousSessions[0])
        }
        alert('Gagal menghapus QR codes: ' + (error.message || 'Unknown error'))
        return
      }

      // Verify deletion was successful
      if (data && data.length > 0) {
        console.log('QR codes deleted successfully:', data.length)
      }

      // Wait a bit to ensure database commit and cache invalidation
      await new Promise(resolve => setTimeout(resolve, 300))

      // Force reload data from database (skip loading state for better UX)
      // This ensures we get the latest data from database
      await loadData(true)
      
      // Small delay before showing alert to ensure UI is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      alert(`✅ Semua QR code (${totalCount}) berhasil dihapus!`)
    } catch (err: any) {
      console.error('Error deleting all QR codes:', err)
      // Reload data to ensure UI is in sync
      await loadData()
      alert('Terjadi kesalahan saat menghapus QR codes: ' + (err.message || 'Unknown error'))
    }
  }

  const deleteCandidate = async (candidateId: string) => {
    if (!confirm('Yakin ingin menghapus kandidat ini?')) return

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) {
        alert('Gagal menghapus kandidat')
        return
      }

      loadData()
    } catch (err) {
      alert('Terjadi kesalahan')
    }
  }

  const downloadQRCode = async (qrCodeUrl: string, qrCodeNumber: number, qrCode: string) => {
    if (!election) {
      alert('Data pemilihan tidak ditemukan. Silakan refresh halaman dan coba lagi.')
      return
    }

    try {
      // Find the QR code element by data attribute
      const qrElement = document.querySelector(`[data-qr-id="${qrCode}"]`) as HTMLElement
      if (!qrElement) {
        alert('QR Code tidak ditemukan. Silakan refresh halaman dan coba lagi.')
        return
      }

      // Wait a bit for SVG to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get the SVG element inside QR code
      const svgElement = qrElement.querySelector('svg') as SVGElement
      if (!svgElement) {
        alert('SVG QR Code tidak ditemukan. Silakan refresh halaman dan coba lagi.')
        return
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement

      // Set size for print (high resolution)
      const printSize = 600 // Higher resolution for print
      clonedSvg.setAttribute('width', printSize.toString())
      clonedSvg.setAttribute('height', printSize.toString())

      // Convert SVG to canvas
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        alert('Canvas tidak didukung di browser ini')
        return
      }

      // Use HTMLImageElement explicitly to avoid conflict with Next.js Image
      const img = document.createElement('img') as HTMLImageElement

      canvas.width = printSize + 80 // Add padding for sides
      canvas.height = printSize + 120 // Extra space for text below QR code

      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Fill white background
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw QR code centered with padding
            const qrSize = printSize - 40 // Add padding
            const x = (canvas.width - qrSize) / 2
            const y = 20
            ctx.drawImage(img, x, y, qrSize, qrSize)

            // Add text below QR code
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(`QR Code #${qrCodeNumber}`, canvas.width / 2, printSize + 45)
            
            ctx.font = '18px Arial'
            ctx.fillStyle = '#333333'
            // Truncate long titles to fit
            const title = election.title.length > 40 ? election.title.substring(0, 40) + '...' : election.title
            ctx.fillText(title, canvas.width / 2, printSize + 75)
            
            ctx.font = '14px Arial'
            ctx.fillStyle = '#666666'
            ctx.fillText('Scan untuk Voting', canvas.width / 2, printSize + 100)

            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Gagal membuat blob'))
                return
              }

              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              const safeTitle = election.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
              link.download = `QRCode-${qrCodeNumber}-${safeTitle}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              // Clean up after a delay
              setTimeout(() => {
                URL.revokeObjectURL(url)
              }, 100)

              resolve()
            }, 'image/png', 1.0) // Highest quality
          } catch (drawError: any) {
            console.error('Error drawing QR code:', drawError)
            reject(new Error('Gagal menggambar QR code: ' + (drawError.message || 'Unknown error')))
          }
        }

        img.onerror = (error) => {
          console.error('Error loading SVG image:', error)
          reject(new Error('Gagal memuat gambar QR code'))
        }

        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        img.src = url
        
        // Clean up SVG blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 5000)
      })
    } catch (error: any) {
      console.error('Error downloading QR code:', error)
      alert('Gagal mengunduh QR code: ' + (error.message || 'Unknown error'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!election) return null

  const votingUrl = votingSession
    ? getVotingUrl(votingSession.qr_code)
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Kembali ke Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{election.title}</h1>
          {election.description && (
            <p className="text-gray-600 mb-4">{election.description}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                election.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {election.is_active ? 'Aktif' : 'Tidak Aktif'}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                election.allow_view_results
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {election.allow_view_results ? 'Hasil Live: Diizinkan' : 'Hasil Live: Diblokir'}
            </span>
            {election.hero_banner_url && (
              <div className="relative w-32 h-20 rounded overflow-hidden">
                <Image
                  src={election.hero_banner_url}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          
          {/* Toggle Allow View Results */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Izinkan Melihat Hasil Live</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Jika diaktifkan, voter dapat melihat hasil voting secara real-time. Jika dinonaktifkan, voter akan melihat pesan bahwa hasil belum diizinkan untuk dilihat.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const newValue = !election.allow_view_results
                    
                    // Update state immediately for better UX
                    setElection({ ...election, allow_view_results: newValue })
                    
                    const { data, error } = await supabase
                      .from('elections')
                      .update({ allow_view_results: newValue })
                      .eq('id', electionId)
                      .select()
                      .single()

                    if (error) {
                      // Revert state on error
                      setElection({ ...election, allow_view_results: !newValue })
                      console.error('Error updating election:', error)
                      alert('Gagal mengubah pengaturan: ' + (error.message || 'Unknown error'))
                      return
                    }

                    // Update with server response
                    if (data) {
                      setElection(data)
                    } else {
                      // Reload data to ensure sync
                      loadData()
                    }
                  } catch (err: any) {
                    // Revert state on error
                    setElection({ ...election, allow_view_results: election.allow_view_results })
                    console.error('Error updating election:', err)
                    alert('Terjadi kesalahan: ' + (err.message || 'Unknown error'))
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  election.allow_view_results ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    election.allow_view_results ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'categories'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Kategori
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'candidates'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Kandidat
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'qr'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                QR Code
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'results'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Hasil Voting
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Daftar Kategori</h2>
                  <Link
                    href={`/admin/elections/${electionId}/categories/new`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Tambah Kategori
                  </Link>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">Belum ada kategori</p>
                    <Link
                      href={`/admin/elections/${electionId}/categories/new`}
                      className="text-blue-600 hover:underline"
                    >
                      Tambah kategori pertama
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {category.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Link
                            href={`/admin/elections/${electionId}/categories/${category.id}`}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm('Yakin ingin menghapus kategori ini?')) return
                              try {
                                const { error } = await supabase
                                  .from('categories')
                                  .delete()
                                  .eq('id', category.id)
                                if (error) {
                                  alert('Gagal menghapus kategori')
                                  return
                                }
                                loadData()
                              } catch (err) {
                                alert('Terjadi kesalahan')
                              }
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'candidates' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Daftar Kandidat</h2>
                  <Link
                    href={`/admin/elections/${electionId}/candidates/new`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Tambah Kandidat
                  </Link>
                </div>

                {candidates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">Belum ada kandidat</p>
                    <Link
                      href={`/admin/elections/${electionId}/candidates/new`}
                      className="text-blue-600 hover:underline"
                    >
                      Tambah kandidat pertama
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {candidate.photo_url ? (
                            <Image
                              src={candidate.photo_url}
                              alt={candidate.name}
                              width={60}
                              height={60}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                              👤
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {candidate.name}
                            </h3>
                            {candidate.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {candidate.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/elections/${electionId}/candidates/${candidate.id}`}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-center text-sm font-medium hover:bg-blue-700"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteCandidate(candidate.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qr' && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                  <h2 className="text-xl font-bold text-gray-900">QR Code untuk Voting</h2>
                  {votingSessions.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={deactivateAllSessions}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-all shadow-sm hover:shadow-md"
                        title="Nonaktifkan semua QR code (tidak dihapus, hanya dinonaktifkan)"
                      >
                        Nonaktifkan Semua
                      </button>
                      <button
                        onClick={deleteAllQRCodes}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-all shadow-sm hover:shadow-md"
                        title="Hapus semua QR code secara permanen"
                      >
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus Semua
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Generate QR Codes Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tambah QR Code Baru</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Tambahkan QR code baru untuk peserta tambahan. QR code yang sudah ada <strong className="text-green-600">tidak akan terhapus</strong> dan voting yang sudah dilakukan tetap aman.
                    </p>
                    {votingSessions.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <p className="text-sm text-green-800">
                          <strong>Total QR Code Aktif:</strong> {votingSessions.length} QR code
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          QR code yang sudah ada tetap aktif dan dapat digunakan untuk voting.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah QR Code Baru (1 QR Code = 1 Peserta)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={qrCount}
                        onChange={(e) => setQrCount(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                        placeholder="Jumlah peserta baru"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        QR code baru akan ditambahkan tanpa menghapus QR code yang sudah ada
                      </p>
                    </div>
                    <button
                      onClick={generateQRCode}
                      disabled={generating || qrCount < 1 || qrCount > 1000}
                      className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all ${
                        generating || qrCount < 1 || qrCount > 1000
                          ? 'opacity-50 cursor-not-allowed'
                          : 'shadow-md hover:shadow-lg'
                      }`}
                    >
                      {generating ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Membuat...
                        </span>
                      ) : (
                        `+ Tambah ${qrCount} QR Code`
                      )}
                    </button>
                  </div>
                </div>

                {/* List of QR Codes */}
                {votingSessions.length > 0 ? (
                  <div>
                    {/* Pagination Info */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <p className="text-sm text-gray-600">
                        Total: <span className="font-semibold">{votingSessions.length}</span> QR code aktif
                      </p>
                      {(() => {
                        const totalPages = Math.ceil(votingSessions.length / qrItemsPerPage)
                        const startIndex = (currentQrPage - 1) * qrItemsPerPage + 1
                        const endIndex = Math.min(currentQrPage * qrItemsPerPage, votingSessions.length)
                        return (
                          <p className="text-sm text-gray-600">
                            Menampilkan {startIndex}-{endIndex} dari {votingSessions.length}
                          </p>
                        )
                      })()}
                    </div>

                    {/* Paginated QR Codes */}
                    {(() => {
                      const totalPages = Math.ceil(votingSessions.length / qrItemsPerPage)
                      const startIndex = (currentQrPage - 1) * qrItemsPerPage
                      const endIndex = startIndex + qrItemsPerPage
                      const paginatedSessions = votingSessions.slice(startIndex, endIndex)

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedSessions.map((session, index) => {
                              const sessionUrl = getVotingUrl(session.qr_code)
                              const globalIndex = startIndex + index + 1
                              return (
                                <div
                                  key={session.id}
                                  className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                                >
                                  <div className="flex flex-col items-center space-y-4">
                                    <div 
                                      className="bg-white p-3 rounded-lg border-2 border-gray-200"
                                      data-qr-id={session.qr_code}
                                    >
                                      <QRCode value={sessionUrl} size={150} />
                                    </div>
                                    <div className="w-full text-center space-y-2">
                                      <p className="text-xs text-gray-500 mb-1 font-semibold">QR Code #{globalIndex}</p>
                                      <p className="text-xs text-gray-400 break-all bg-gray-50 p-2 rounded">
                                        {session.qr_code.substring(0, 30)}...
                                      </p>
                                      <div className="flex flex-col gap-2 mt-3">
                                        <button
                                          onClick={() => downloadQRCode(sessionUrl, globalIndex, session.qr_code)}
                                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          Download untuk Print
                                        </button>
                                        <div className="flex gap-2">
                                          <a
                                            href={sessionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium transition-colors"
                                          >
                                            Buka Link
                                          </a>
                                          <button
                                            onClick={() => deleteQRCode(session.id, globalIndex)}
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                            title="Hapus QR code ini secara permanen"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Hapus
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                              {/* Page Info */}
                              <p className="text-sm text-gray-600">
                                Halaman <span className="font-semibold">{currentQrPage}</span> dari <span className="font-semibold">{totalPages}</span>
                              </p>

                              {/* Pagination Buttons */}
                              <div className="flex items-center gap-2">
                                {/* Previous Button */}
                                <button
                                  onClick={() => setCurrentQrPage(prev => Math.max(1, prev - 1))}
                                  disabled={currentQrPage === 1}
                                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1 ${
                                    currentQrPage === 1
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                  <span className="hidden sm:inline">Sebelumnya</span>
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    const showPage = 
                                      page === 1 ||
                                      page === totalPages ||
                                      (page >= currentQrPage - 1 && page <= currentQrPage + 1)

                                    if (!showPage) {
                                      // Show ellipsis
                                      const prevPage = page - 1
                                      const nextPage = page + 1
                                      if (
                                        (prevPage === 1 || (prevPage >= currentQrPage - 1 && prevPage <= currentQrPage + 1)) &&
                                        (nextPage === totalPages || (nextPage >= currentQrPage - 1 && nextPage <= currentQrPage + 1))
                                      ) {
                                        return (
                                          <span key={page} className="px-2 text-gray-400">
                                            ...
                                          </span>
                                        )
                                      }
                                      return null
                                    }

                                    return (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentQrPage(page)}
                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                          page === currentQrPage
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    )
                                  })}
                                </div>

                                {/* Next Button */}
                                <button
                                  onClick={() => setCurrentQrPage(prev => Math.min(totalPages, prev + 1))}
                                  disabled={currentQrPage === totalPages}
                                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1 ${
                                    currentQrPage === totalPages
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  <span className="hidden sm:inline">Selanjutnya</span>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600 mb-4">
                      Belum ada QR code yang aktif. Generate QR code untuk memulai voting.
                    </p>
                    <p className="text-sm text-gray-500">
                      1 QR Code = 1 Peserta. Pastikan jumlah QR code sesuai dengan jumlah peserta yang akan hadir.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Hasil Voting</h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link
                    href={`/admin/elections/${electionId}/results`}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center"
                  >
                    Lihat Hasil (Admin)
                  </Link>
                  <Link
                    href={`/voter/results?election=${electionId}`}
                    target="_blank"
                    className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
                  >
                    Lihat Halaman Public
                  </Link>
                </div>
                <p className="text-gray-600">
                  Gunakan tombol di atas untuk melihat hasil voting. Halaman admin untuk monitoring, halaman public untuk ditampilkan ke publik.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

