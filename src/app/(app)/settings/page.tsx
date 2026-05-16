import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { SettingsForm } from './settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user || !can(session.user.role, 'SETTINGS_MANAGE')) redirect('/dashboard')

  const settings = await prisma.companySettings.findUnique({ where: { id: 'singleton' } })
  if (!settings) redirect('/dashboard')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold mb-6">Company Settings</h1>
      <SettingsForm
        initial={{
          name: settings.name,
          legalName: settings.legalName,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          vatNumber: settings.vatNumber,
          registrationNumber: settings.registrationNumber,
          taxRate: Number(settings.taxRate),
          bankName: settings.bankName,
          bankBranch: settings.bankBranch,
          bankAccountName: settings.bankAccountName,
          bankAccountNumber: settings.bankAccountNumber,
        }}
      />
    </div>
  )
}
