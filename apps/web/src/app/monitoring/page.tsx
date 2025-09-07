import { MonitoringPage } from '../../components/templates/monitoring-page'
import Link from 'next/link'

export default function Monitoring() {
  return (
    <div>
      <nav className="p-4 bg-white shadow-sm">
        <div className="container mx-auto flex gap-4">
          <Link href="/" className="text-blue-600 hover:underline">検索</Link>
          <Link href="/laws" className="text-blue-600 hover:underline">全法令一覧</Link>
          <Link href="/monitoring" className="text-blue-600 hover:underline font-semibold">監視中</Link>
        </div>
      </nav>
      <MonitoringPage />
    </div>
  )
}
