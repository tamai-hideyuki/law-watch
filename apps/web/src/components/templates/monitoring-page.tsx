import { WatchLists } from '../organisms/watch-lists'

export const MonitoringPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">監視中の法令</h1>
          <p className="mt-2 text-gray-600">ウォッチリストで監視している法令一覧</p>
        </div>
        
        <WatchLists />
      </div>
    </div>
  )
}
