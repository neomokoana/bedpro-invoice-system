import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SetPasswordForm } from './set-password-form'
import { BedProLogo } from '@/components/bedpro-logo'

export const metadata: Metadata = { title: 'Set your password · Bed Pro' }

export default async function SetPasswordPage() {
  const [session, company] = await Promise.all([
    auth(),
    prisma.companySettings.findUnique({
      where: { id: 'singleton' },
      select: { logoUrl: true },
    }),
  ])
  if (!session?.user) redirect('/login')
  if (!session.user.mustChangePassword) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6] p-6">
      <div className="bp-card w-full max-w-md p-8">
        <BedProLogo size={28} src={company?.logoUrl ?? null} />
        <h1 className="mt-6 text-2xl font-extrabold">Set your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          You signed in with a temporary password. Choose a permanent one to continue.
        </p>
        <SetPasswordForm />
      </div>
    </div>
  )
}
