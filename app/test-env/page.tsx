'use client'

export default function TestEnvPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Test Environment Variables</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <p className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</p>
          <p className={url ? 'text-green-600' : 'text-red-600'}>
            {url ? `✅ ${url.substring(0, 30)}...` : '❌ Tidak ditemukan'}
          </p>
        </div>

        <div>
          <p className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</p>
          <p className={anonKey ? 'text-green-600' : 'text-red-600'}>
            {anonKey ? `✅ ${anonKey.substring(0, 30)}...` : '❌ Tidak ditemukan'}
          </p>
        </div>

        <div>
          <p className="font-semibold">SUPABASE_SERVICE_ROLE_KEY:</p>
          <p className={serviceKey ? 'text-green-600' : 'text-red-600'}>
            {serviceKey ? `✅ ${serviceKey.substring(0, 30)}...` : '❌ Tidak ditemukan'}
          </p>
        </div>

        {!url || !anonKey ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-red-800 font-semibold">⚠️ Environment variables penting tidak ditemukan!</p>
            <p className="text-red-600 text-sm mt-2">
              Pastikan file .env.local ada di root folder dan sudah di-restart server.
            </p>
            <p className="text-red-600 text-sm mt-1">
              <strong>Wajib:</strong> NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="text-green-800 font-semibold">✅ Environment variables penting sudah ditemukan!</p>
            {!serviceKey && (
              <p className="text-yellow-700 text-sm mt-2">
                ⚠️ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan (opsional untuk client-side, tapi diperlukan untuk admin operations)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

