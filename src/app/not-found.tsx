import Link from 'next/link'
import { BedProLogo } from '@/components/bedpro-logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6] p-6">
      <div className="bp-card p-8 text-center max-w-md">
        <BedProLogo size={28} />
        <h1 className="mt-6 text-2xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="bp-btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  )
}
