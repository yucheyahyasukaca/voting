'use client'

export const runtime = 'edge'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditCandidatePage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string
  const candidateId = params.candidateId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
      setPreviewUrl(data.photo_url || null)
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto (opsional)
            </label>
            
            {/* Preview Image */}
            {previewUrl && (
              <div className="mb-3">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-3 items-start">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  setUploading(true)
                  try {
                    // Generate unique filename
                    const fileExt = file.name.split('.').pop()
                    const fileName = `candidates/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                    
                    // Upload to Supabase Storage
                    const { data, error } = await supabase.storage
                      .from('elections')
                      .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                      })

                    if (error) {
                      alert('Gagal upload foto: ' + error.message)
                      setUploading(false)
                      return
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                      .from('elections')
                      .getPublicUrl(fileName)

                    setFormData({ ...formData, photo_url: publicUrl })
                    setPreviewUrl(publicUrl)
                  } catch (err: any) {
                    alert('Terjadi kesalahan saat upload: ' + (err.message || 'Unknown error'))
                  } finally {
                    setUploading(false)
                  }
                }}
                className="hidden"
                id="photo-upload-edit"
                disabled={uploading}
              />
              
              <label
                htmlFor="photo-upload-edit"
                className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors inline-block ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Mengupload...' : '📤 Upload Foto'}
              </label>

              {formData.photo_url && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, photo_url: '' })
                    setPreviewUrl(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* URL Input (Manual) */}
            <div className="mt-3">
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => {
                  setFormData({ ...formData, photo_url: e.target.value })
                  setPreviewUrl(e.target.value || null)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="Atau masukkan URL foto secara manual"
              />
            </div>
            
            <p className="mt-1 text-sm text-gray-500">
              Upload foto ke Supabase Storage bucket "elections" atau masukkan URL secara manual
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
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

