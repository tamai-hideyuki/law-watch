'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navigation = () => {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="p-4 bg-white shadow-sm">
      <div className="container mx-auto flex gap-4">
        <Link 
          href="/" 
          className={`text-blue-600 hover:underline ${isActive('/') ? 'font-medium' : ''}`}
        >
          監視対象追加
        </Link>
        <Link 
          href="/monitoring" 
          className={`text-blue-600 hover:underline ${isActive('/monitoring') ? 'font-medium' : ''}`}
        >
          監視管理
        </Link>
        <Link 
          href="/laws" 
          className={`text-blue-600 hover:underline ${isActive('/laws') ? 'font-medium' : ''}`}
        >
          監視中法令
        </Link>
      </div>
    </nav>
  )
}