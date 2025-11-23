'use client'

export const runtime = 'edge'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCandidatePage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    order_index: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('candidates')
        .insert({
          election_id: electionId,
          name: formData.name,
          description: formData.description || null,
          photo_url: formData.photo_url || null,
          order_index: formData.order_index,
        })

      if (error) {
        alert('Gagal menambah kandidat: ' + error.message)
        setLoading(false)
        return
      }

      router.push(`/admin/elections/${electionId}`)
    } catch (err) {
      alert('Terjadi kesalahan')
      setLoading(false)
    }
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
          Tambah Kandidat Baru
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="Nama lengkap kandidat"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="Deskripsi atau visi misi kandidat..."
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
                id="photo-upload"
                disabled={uploading}
              />
              
              <label
                htmlFor="photo-upload"
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
            <p className="mt-1 text-sm text-gray-500">
              Urutan tampil kandidat (0 = pertama)
            </p>
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
              disabled={loading}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Tambah Kandidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

