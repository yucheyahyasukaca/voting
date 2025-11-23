'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewElectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    hero_banner_url: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('elections')
        .insert({
          title: formData.title,
          description: formData.description || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          hero_banner_url: formData.hero_banner_url || null,
          is_active: false,
        })
        .select()
        .single()

      if (error) {
        alert('Gagal membuat pemilihan: ' + error.message)
        setLoading(false)
        return
      }

      router.push(`/admin/elections/${data.id}`)
    } catch (err) {
      alert('Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Kembali ke Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Buat Pemilihan Baru
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Pemilihan *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="Contoh: Pilih Pejabat Favorit Anda 2025"
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
              placeholder="Deskripsi pemilihan..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Berakhir
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Hero (opsional)
            </label>
            
            {/* Preview Image */}
            {previewUrl && (
              <div className="mb-3">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-3 items-start mb-3">
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
                    const fileName = `banners/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                    
                    // Upload to Supabase Storage
                    const { data, error } = await supabase.storage
                      .from('elections')
                      .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                      })

                    if (error) {
                      alert('Gagal upload banner: ' + error.message)
                      setUploading(false)
                      return
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                      .from('elections')
                      .getPublicUrl(fileName)

                    setFormData({ ...formData, hero_banner_url: publicUrl })
                    setPreviewUrl(publicUrl)
                  } catch (err: any) {
                    alert('Terjadi kesalahan saat upload: ' + (err.message || 'Unknown error'))
                  } finally {
                    setUploading(false)
                  }
                }}
                className="hidden"
                id="banner-upload"
                disabled={uploading}
              />
              
              <label
                htmlFor="banner-upload"
                className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors inline-block ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Mengupload...' : '📤 Upload Banner'}
              </label>

              {formData.hero_banner_url && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, hero_banner_url: '' })
                    setPreviewUrl(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* URL Input (Manual) */}
            <div>
              <input
                type="url"
                value={formData.hero_banner_url}
                onChange={(e) => {
                  setFormData({ ...formData, hero_banner_url: e.target.value })
                  setPreviewUrl(e.target.value || null)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="Atau masukkan URL banner secara manual"
              />
            </div>
            
            <p className="mt-1 text-sm text-gray-500">
              Upload banner ke Supabase Storage bucket "elections" atau masukkan URL secara manual
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/admin"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Buat Pemilihan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

