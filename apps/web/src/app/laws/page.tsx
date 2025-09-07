import { AllLawsPage } from '../../components/templates/all-laws-page'
import Link from 'next/link'

export default function LawsPage() {
  return (
    <div>
      <nav className="p-4 bg-white shadow-sm">
        <div className="container mx-auto flex gap-4">
          <Link href="/" className="text-blue-600 hover:underline">検索</Link>
        </div>
      </nav>
      <AllLawsPage />
    </div>
  )
}