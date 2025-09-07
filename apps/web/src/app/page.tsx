import { SearchPage } from '../components/templates/search-page'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <nav className="p-4 bg-white shadow-sm">
        <div className="container mx-auto flex gap-4">
          <Link href="/laws" className="text-blue-600 hover:underline">全法令一覧</Link>
          <Link href="/monitoring" className="text-blue-600 hover:underline">監視中</Link>
        </div>
      </nav>
      <SearchPage />
    </div>
  )
}
