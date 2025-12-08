'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getVotingUrl } from '@/lib/app-url'
import QRCode from '@/components/QRCode'

interface Election {
    id: string
    title: string
}

interface VotingSession {
    id: string
    qr_code: string
    is_active: boolean
}

export default function PrintQRCodesPage() {
    const params = useParams()
    const router = useRouter()
    const electionId = params.id as string

    const [election, setElection] = useState<Election | null>(null)
    const [sessions, setSessions] = useState<VotingSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [electionId])

    const loadData = async () => {
        try {
            setLoading(true)

            // Load election details
            const { data: electionData, error: electionError } = await supabase
                .from('elections')
                .select('id, title')
                .eq('id', electionId)
                .single()

            if (electionError || !electionData) {
                alert('Pemilihan tidak ditemukan')
                router.push('/admin')
                return
            }

            setElection(electionData)

            // Load ALL active voting sessions
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('voting_sessions')
                .select('*')
                .eq('election_id', electionId)
                .eq('is_active', true)
                .order('created_at', { ascending: true })

            if (sessionsError) {
                console.error('Error loading sessions:', sessionsError)
            } else {
                setSessions(sessionsData || [])
            }
        } catch (err) {
            console.error('Error loading data:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data QR code...</p>
                </div>
            </div>
        )
    }

    if (!election) return null

    return (
        <div className="min-h-screen bg-white text-black p-0 m-0">
            {/* Print Controls - Hidden when printing */}
            <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-md z-50 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Print Preview: {election.title}</h1>
                    <p className="text-sm text-gray-600">{sessions.length} QR Codes aktif</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm"
                    >
                        🖨️ Print Sekarang
                    </button>
                </div>
            </div>

            {/* Main Content - Padded to avoid overlap with fixed header on screen */}
            <div className="pt-24 print:pt-0 p-8 print:p-0">
                <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              background: white;
            }
            .print-hidden {
              display: none !important;
            }
            .page-break {
              page-break-after: always;
            }
          }
        `}</style>

                {/* Grid for QR Codes - 2 columns for A4 */}
                <div className="grid grid-cols-2 gap-8 print:gap-6 print:block">
                    {sessions.map((session, index) => {
                        // Logic for grouping in print layout (simulated with standard grid for now, browser handles flow)
                        // But for explicit page breaks or styling, we treat each item primarily.
                        // Using inline-block or stick to grid with print styles can be tricky.
                        // A safer bet for A4 grid is flex wrap or consistent grid.
                        // Let's use a wrapper that ensures 2 items per row nicely.

                        return (
                            <div
                                key={session.id}
                                className="border border-gray-300 print:border-gray-400 rounded-lg p-4 flex flex-col items-center justify-center text-center break-inside-avoid mb-4 print:mb-4 print:w-[48%] print:inline-flex print:mr-[1%] print:ml-[1%] print:h-[280px]"
                            >
                                <div className="border-4 border-black p-2 bg-white rounded-lg mb-2">
                                    <QRCode value={getVotingUrl(session.qr_code)} size={150} />
                                </div>

                                <div className="text-xl font-black text-gray-900 mb-1">
                                    #{index + 1}
                                </div>



                                <div className="mt-2 text-xs text-gray-400">
                                    Scan untuk memberikan suara
                                </div>
                            </div>
                        )
                    })}
                </div>

                {sessions.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">Belum ada QR code yang aktif.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
