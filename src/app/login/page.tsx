import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginForm } from './login-form'
import { BedProLogo } from '@/components/bedpro-logo'

export const metadata: Metadata = { title: 'Sign in · Bed Pro' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  // Next 16 / React 19: searchParams is a Promise. Await it.
  const params = await searchParams
  const session = await auth()
  if (session?.user) {
    redirect(session.user.mustChangePassword ? '/set-password' : '/dashboard')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F6F6F6]">
      <div className="hidden lg:flex flex-col justify-between bg-[#111] text-white p-12">
        <BedProLogo size={36} />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Invoice & receipt management
            <br />
            <span className="text-[#E8191A]">built for Bed Pro.</span>
          </h1>
          <p className="mt-4 text-sm text-gray-400 max-w-md">
            Create invoices, track payments, email customers and generate branded PDFs — all in
            one place.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Bed Pro © {new Date().getFullYear()} · Pretoria, South Africa
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="bp-card w-full max-w-md p-8">
          <div className="lg:hidden mb-6">
            <BedProLogo size={32} />
          </div>
          <h2 className="text-2xl font-extrabold">Sign in</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your work email and password to continue.
          </p>
          <LoginForm callbackUrl={params.callbackUrl} initialError={params.error} />
          <p className="mt-6 text-xs text-gray-400 text-center">
            Need an account? Contact your administrator. We don&apos;t allow public sign-up.
          </p>
        </div>
      </div>
    </div>
  )
}
