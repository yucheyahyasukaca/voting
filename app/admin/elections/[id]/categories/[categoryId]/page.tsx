'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const electionId = params.id as string
  const categoryId = params.categoryId as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: '',
    order_index: 0,
    is_active: true,
  })

  useEffect(() => {
    loadCategory()
  }, [categoryId])

  const loadCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (error || !data) {
        alert('Kategori tidak ditemukan')
        router.push(`/admin/elections/${electionId}`)
        return
      }

      setFormData({
        name: data.name,
        description: data.description || '',
        icon_url: data.icon_url || '',
        order_index: data.order_index || 0,
        is_active: data.is_active ?? true,
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
        .from('categories')
        .update({
          name: formData.name,
          description: formData.description || null,
          icon_url: formData.icon_url || null,
          order_index: formData.order_index || 0,
          is_active: formData.is_active,
        })
        .eq('id', categoryId)

      if (error) {
        alert('Gagal mengupdate kategori: ' + error.message)
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/admin/elections/${electionId}`}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Kembali
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Kategori</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kategori *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="Contoh: Pejabat Terfavorit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="Deskripsi kategori (opsional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Icon (opsional)
              </label>
              <input
                type="url"
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urutan
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Aktif
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <Link
                href={`/admin/elections/${electionId}`}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

