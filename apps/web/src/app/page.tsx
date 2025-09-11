import { Navigation } from '../components/molecules/navigation'

export default function Home() {
  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Law Watch</h1>
            <p className="mt-2 text-gray-600">法的変化の早期発見による社会の安全性向上システム</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">監視対象追加</h2>
              <p className="text-gray-600 mb-4">
                法令IDを入力して新しい法令を監視対象に追加できます。
              </p>
              <a href="/monitoring" className="text-blue-600 hover:underline">
                監視対象を追加する →
              </a>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">監視中の法令</h2>
              <p className="text-gray-600 mb-4">
                現在監視中の法令を確認・管理できます。
              </p>
              <a href="/laws" className="text-blue-600 hover:underline">
                監視中の法令を見る →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
