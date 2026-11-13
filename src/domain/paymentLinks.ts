export type PaymentStatus = 'Active' | 'Partially paid' | 'Paid' | 'Expired'
export type Contact = { kind: 'email' | 'phone'; value: string }
export type PaymentLink = {
  id: string
  amount: number
  amountPaid: number
  allowPartialPayments: boolean
  minimumFirstPayment?: number
  description: string
  contact: Contact
  status: PaymentStatus
  createdAt: string
  expiresAt?: string
}
export type LinkDraft = {
  amount: string
  description: string
  contact: string
  expiry: string
  allowPartialPayments: boolean
  minimumFirstPayment: string
}
export type FormErrors = Partial<Record<keyof LinkDraft, string>>

const cents = (amount: number) => Math.round(amount * 100)

export function amountDue(link: PaymentLink): number {
  return Math.max(0, cents(link.amount) - cents(link.amountPaid)) / 100
}

export function validateDraft(draft: LinkDraft, now = new Date()): FormErrors {
  const errors: FormErrors = {}
  const rawAmount = draft.amount.trim()
  const amount = Number(rawAmount)
  if (!rawAmount || !Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter an amount greater than ₹0.'
  else if (amount > 500000) errors.amount = 'Amount cannot exceed ₹5,00,000.'
  else if (!/^\d+(?:\.\d{1,2})?$/.test(rawAmount)) errors.amount = 'Use up to 2 decimal places.'

  const description = draft.description.trim()
  if (!description) errors.description = 'Description is required.'
  else if (description.length > 100) errors.description = 'Description must be 100 characters or fewer.'

  const contact = draft.contact.trim()
  if (!contact) errors.contact = 'Enter an email address or phone number.'
  else if (contact.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) errors.contact = 'Enter a valid email address or phone number.'
  } else if (!/^\+?[\d\s().-]{7,20}$/.test(contact) || contact.replace(/\D/g, '').length < 7 || contact.replace(/\D/g, '').length > 15) {
    errors.contact = 'Enter a valid email address or phone number.'
  }

  if (draft.allowPartialPayments) {
    const rawMinimum = draft.minimumFirstPayment.trim()
    const minimum = Number(rawMinimum)
    if (!rawMinimum || !Number.isFinite(minimum) || minimum <= 0) errors.minimumFirstPayment = 'Enter a minimum first payment greater than ₹0.'
    else if (!/^\d+(?:\.\d{1,2})?$/.test(rawMinimum)) errors.minimumFirstPayment = 'Use up to 2 decimal places.'
    else if (Number.isFinite(amount) && amount > 0 && minimum > amount) errors.minimumFirstPayment = 'Minimum first payment cannot exceed the total amount.'
  }

  if (draft.expiry) {
    const expiry = new Date(`${draft.expiry}T23:59:59`)
    if (Number.isNaN(expiry.getTime()) || expiry <= now) errors.expiry = 'Expiry date must be in the future.'
  }
  return errors
}

export function validatePayment(link: PaymentLink, rawPayment: string): string | undefined {
  const status = getLinkStatus(link)
  if (status === 'Expired') return 'Expired payment links cannot accept payments.'
  if (status === 'Paid') return 'This payment link is already fully paid.'
  const raw = rawPayment.trim()
  const payment = Number(raw)
  const due = amountDue(link)
  if (!raw || !Number.isFinite(payment) || payment <= 0) return 'Enter a payment greater than ₹0.'
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return 'Use up to 2 decimal places.'
  if (cents(payment) > cents(due)) return 'Payment cannot exceed the amount due.'
  if (!link.allowPartialPayments && cents(payment) !== cents(due)) return 'Full remaining payment is required.'
  if (link.allowPartialPayments && cents(link.amountPaid) === 0 && cents(payment) < cents(link.minimumFirstPayment ?? 0)) {
    return 'First payment must meet the minimum amount.'
  }
  return undefined
}

export function getLinkStatus(link: PaymentLink, now = new Date()): PaymentStatus {
  if (cents(link.amountPaid) >= cents(link.amount)) return 'Paid'
  if (link.expiresAt && new Date(link.expiresAt).getTime() < now.getTime()) return 'Expired'
  if (cents(link.amountPaid) > 0) return 'Partially paid'
  return 'Active'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function restoreLinks(serialized: string | null, now = new Date()): PaymentLink[] {
  if (!serialized) return []
  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((value): PaymentLink[] => {
      if (!isObject(value) || typeof value.id !== 'string' || !value.id ||
        typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount <= 0 ||
        typeof value.description !== 'string' || typeof value.createdAt !== 'string' || !Number.isFinite(new Date(value.createdAt).getTime()) ||
        !isObject(value.contact) || typeof value.contact.value !== 'string' ||
        (value.contact.kind !== 'email' && value.contact.kind !== 'phone')) return []

      const oldStatus = value.status
      const amountPaid = typeof value.amountPaid === 'number' && Number.isFinite(value.amountPaid) && value.amountPaid >= 0
        ? Math.min(value.amount, value.amountPaid)
        : oldStatus === 'Paid' ? value.amount : 0
      const minimumFirstPayment = typeof value.minimumFirstPayment === 'number' && Number.isFinite(value.minimumFirstPayment) && value.minimumFirstPayment > 0 && value.minimumFirstPayment <= value.amount
        ? value.minimumFirstPayment
        : undefined
      const allowPartialPayments = value.allowPartialPayments === true && minimumFirstPayment !== undefined
      const expiresAt = typeof value.expiresAt === 'string' && Number.isFinite(new Date(value.expiresAt).getTime()) ? value.expiresAt : undefined
      const restored: PaymentLink = {
        id: value.id,
        amount: value.amount,
        amountPaid,
        allowPartialPayments,
        ...(allowPartialPayments && minimumFirstPayment !== undefined ? { minimumFirstPayment } : {}),
        description: value.description,
        contact: { kind: value.contact.kind, value: value.contact.value },
        status: 'Active',
        createdAt: value.createdAt,
        ...(expiresAt ? { expiresAt } : {}),
      }
      restored.status = getLinkStatus(restored, now)
      return [restored]
    })
  } catch {
    return []
  }
}

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}
