'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase-mock'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Election {
  id: string
  title: string
  description: string
}

interface CandidateResult {
  id: string
  name: string
  description: string
  photo_url: string | null
  vote_count: number
  percentage: number
}

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const electionId = searchParams.get('election')
  
  const [election, setElection] = useState<Election | null>(null)
  const [results, setResults] = useState<CandidateResult[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!electionId) return

    loadResults()
    
    // Refresh setiap 3 detik untuk simulasi real-time
    const interval = setInterval(() => {
      loadResults()
    }, 3000)

    return () => clearInterval(interval)
  }, [electionId])

  useEffect(() => {
    // Mock countdown timer
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

    // Set initial time
    setTimeRemaining({ hours: 2, minutes: 25, seconds: 45 })

    return () => clearInterval(interval)
  }, [])

  const loadResults = async () => {
    if (!electionId) return

    try {
      const { data: electionData } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single()

      if (electionData) {
        setElection(electionData)
      }

      const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true })

      if (!candidates) return

      const { data: votes } = await supabase
        .from('votes')
        .select('candidate_id')
        .eq('election_id', electionId)

      const total = votes?.length || 0
      setTotalVotes(total)

      const voteCounts: Record<string, number> = {}
      votes?.forEach((vote) => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1
      })

      const candidateResults: CandidateResult[] = candidates.map((candidate) => {
        const voteCount = voteCounts[candidate.id] || 0
        return {
          ...candidate,
          vote_count: voteCount,
          percentage: total > 0 ? (voteCount / total) * 100 : 0,
        }
      })

      candidateResults.sort((a, b) => b.vote_count - a.vote_count)
      setResults(candidateResults)
    } catch (err) {
      console.error('Error loading results:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat hasil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-sm">DISDIKBUD</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 text-sm">Panitia Pemilihan</span>
          </div>
          <Link href="/admin" className="text-blue-600 text-sm">Butuh bantuan?</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hasil Voting Live
        </h1>
        {election && (
          <p className="text-gray-600 mb-8">Pantau perkembangan pemilihan.</p>
        )}

        {/* Stats Cards - Sesuai Referensi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Suara</p>
                <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
              </div>
              <div className="text-4xl">👤</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Kemajuan Voting</p>
                <p className="text-3xl font-bold text-green-600">65%</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>
        </div>

        {/* Time Remaining Card - Sesuai Referensi */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🕐</div>
            <div className="flex-1">
                <p className="text-gray-600 text-sm mb-2">Waktu Tersisa</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </p>
                    <p className="text-xs text-gray-500">Jam</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </p>
                    <p className="text-xs text-gray-500">Menit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </p>
                    <p className="text-xs text-gray-500">Detik</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Election Summary - Sesuai Referensi */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ringkasan Pemilihan</h2>
            <span className="text-xl">📊</span>
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada hasil voting
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`border-2 rounded-lg p-4 ${
                    index === 0 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-shrink-0">
                      {candidate.photo_url ? (
                        <Image
                          src={candidate.photo_url}
                          alt={candidate.name}
                          width={60}
                          height={60}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {candidate.name}
                      </h3>
                      {candidate.description && (
                        <p className="text-gray-600 text-sm">{candidate.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {candidate.vote_count} suara
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {candidate.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        index === 0 ? 'bg-yellow-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${candidate.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadResults}
            className="text-blue-600 hover:underline flex items-center gap-2 mx-auto"
          >
            <span>🔄</span>
            <span>Muat Ulang</span>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Hasil diperbarui secara real-time</p>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat hasil...</p>
        </div>
      </div>
    }>
      <ResultsPageContent />
    </Suspense>
  )
}
