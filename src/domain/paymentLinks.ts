export type PaymentStatus = 'Active' | 'Paid' | 'Expired'
export type Contact = { kind: 'email' | 'phone'; value: string }
export type PaymentLink = {
  id: string
  amount: number
  description: string
  contact: Contact
  status: PaymentStatus
  createdAt: string
  expiresAt?: string
}
export type LinkDraft = { amount: string; description: string; contact: string; expiry: string }
export type FormErrors = Partial<Record<keyof LinkDraft, string>>

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

  if (draft.expiry) {
    const expiry = new Date(`${draft.expiry}T23:59:59`)
    if (Number.isNaN(expiry.getTime()) || expiry <= now) errors.expiry = 'Expiry date must be in the future.'
  }
  return errors
}

export function getLinkStatus(link: PaymentLink, now = new Date()): PaymentStatus {
  if (link.status === 'Paid') return 'Paid'
  if (link.expiresAt && new Date(link.expiresAt).getTime() < now.getTime()) return 'Expired'
  return 'Active'
}

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}
