import {
  CheckCircle2,
  Circle,
  MailCheck,
  FileEdit,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import type { DisplayStatus } from '@/lib/status'
import { STATUS_LABEL } from '@/lib/status'

const ICONS: Record<DisplayStatus, LucideIcon> = {
  paid: CheckCircle2,
  unpaid: Circle,
  sent: MailCheck,
  draft: FileEdit,
  overdue: AlertCircle,
}

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const Icon = ICONS[status]
  return (
    <span className={`bp-badge-${status}`}>
      <Icon className="h-2.5 w-2.5" />
      {STATUS_LABEL[status]}
    </span>
  )
}
