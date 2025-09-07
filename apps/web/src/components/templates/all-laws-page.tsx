import { LawsList } from '../organisms/laws-list'

export const AllLawsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">全法令一覧</h1>
          <p className="mt-2 text-gray-600">日本国の法令データベース</p>
        </div>
        
        <LawsList />
      </div>
    </div>
  )
}
