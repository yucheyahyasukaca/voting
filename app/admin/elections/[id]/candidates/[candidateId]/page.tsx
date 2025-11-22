'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-mock'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditCandidatePage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string
  const candidateId = params.candidateId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    order_index: 0,
  })

  useEffect(() => {
    loadCandidate()
  }, [candidateId])

  const loadCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single()

      if (error || !data) {
        alert('Kandidat tidak ditemukan')
        router.push(`/admin/elections/${electionId}`)
        return
      }

      setFormData({
        name: data.name,
        description: data.description || '',
        photo_url: data.photo_url || '',
        order_index: data.order_index || 0,
      })
    } catch (err) {
      alert('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          name: formData.name,
          description: formData.description || null,
          photo_url: formData.photo_url || null,
          order_index: formData.order_index,
        })
        .eq('id', candidateId)

      if (error) {
        alert('Gagal mengupdate kandidat: ' + error.message)
        setSaving(false)
        return
      }

      router.push(`/admin/elections/${electionId}`)
    } catch (err) {
      alert('Terjadi kesalahan')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/admin/elections/${electionId}`}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Kembali
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Edit Kandidat
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kandidat *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Foto (opsional)
            </label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload foto ke Supabase Storage dan masukkan URL di sini
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urutan Tampil
            </label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="flex gap-4">
            <Link
              href={`/admin/elections/${electionId}`}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

