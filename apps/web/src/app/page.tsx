import { MonitoringPage } from '../components/templates/monitoring-page'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <nav className="p-4 bg-white shadow-sm">
        <div className="container mx-auto flex gap-4">
          <Link href="/" className="text-blue-600 hover:underline font-medium">監視対象追加</Link>
          <Link href="/monitoring" className="text-blue-600 hover:underline">監視管理</Link>
          <Link href="/laws" className="text-blue-600 hover:underline">監視中法令</Link>
        </div>
      </nav>
      <MonitoringPage />
    </div>
  )
}
