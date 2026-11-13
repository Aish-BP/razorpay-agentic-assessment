import { describe, expect, it } from 'vitest'
import { amountDue, getLinkStatus, restoreLinks, validateDraft, validatePayment, type LinkDraft, type PaymentLink } from './paymentLinks'

const valid: LinkDraft = { amount: '1250.50', description: 'Design retainer', contact: 'buyer@example.com', expiry: '', allowPartialPayments: false, minimumFirstPayment: '' }
const partialLink: PaymentLink = { id: '1', amount: 100, amountPaid: 0, allowPartialPayments: true, minimumFirstPayment: 25, description: 'Invoice', contact: { kind: 'email', value: 'a@b.com' }, status: 'Active', createdAt: '2025-01-01T12:30:00.000Z', expiresAt: '2099-01-10T23:59:59' }

describe('payment link validation', () => {
  it('accepts valid drafts and email or phone contacts', () => {
    expect(validateDraft(valid)).toEqual({})
    expect(validateDraft({ ...valid, contact: '+91 98765 43210' })).toEqual({})
  })
  it('rejects invalid amount bounds, precision, missing description, and contact', () => {
    expect(validateDraft({ ...valid, amount: '0' }).amount).toMatch(/greater than/)
    expect(validateDraft({ ...valid, amount: '500000.01' }).amount).toMatch(/cannot exceed/)
    expect(validateDraft({ ...valid, amount: '10.999' }).amount).toMatch(/2 decimal/)
    expect(validateDraft({ ...valid, description: ' ' }).description).toMatch(/required/)
    expect(validateDraft({ ...valid, contact: 'not-an-email' }).contact).toMatch(/valid/)
  })
  it('requires a positive minimum first payment no greater than the total', () => {
    expect(validateDraft({ ...valid, allowPartialPayments: true }).minimumFirstPayment).toMatch(/greater than/)
    expect(validateDraft({ ...valid, amount: '100', allowPartialPayments: true, minimumFirstPayment: '0' }).minimumFirstPayment).toMatch(/greater than/)
    expect(validateDraft({ ...valid, amount: '100', allowPartialPayments: true, minimumFirstPayment: '100.01' }).minimumFirstPayment).toMatch(/cannot exceed/)
    expect(validateDraft({ ...valid, amount: '100', allowPartialPayments: true, minimumFirstPayment: '25' })).toEqual({})
  })
  it('requires any configured expiry date to be in the future', () => {
    expect(validateDraft({ ...valid, expiry: '2020-01-01' }, new Date('2024-01-01')).expiry).toMatch(/future/)
  })
})

describe('payment recording and balances', () => {
  it('requires partial first payment to meet the minimum and limits it to the amount due', () => {
    expect(validatePayment(partialLink, '24.99')).toMatch(/minimum/)
    expect(validatePayment(partialLink, '100.01')).toMatch(/exceed/)
    expect(validatePayment(partialLink, '25.001')).toMatch(/2 decimal/)
    expect(validatePayment(partialLink, '25')).toBeUndefined()
  })
  it('requires a full payment when partial payments are disabled', () => {
    const fullOnly = { ...partialLink, allowPartialPayments: false, minimumFirstPayment: undefined }
    expect(validatePayment(fullOnly, '99')).toMatch(/Full remaining/)
    expect(validatePayment(fullOnly, '100')).toBeUndefined()
  })
  it('calculates amount due and accepts later partial payments against the balance', () => {
    const afterFirst = { ...partialLink, amountPaid: 30, status: 'Partially paid' as const }
    expect(amountDue(afterFirst)).toBe(70)
    expect(validatePayment(afterFirst, '70.01')).toMatch(/exceed/)
    expect(validatePayment(afterFirst, '50')).toBeUndefined()
  })
  it('transitions Active to Partially paid to Paid based on amount received', () => {
    const beforeExpiry = new Date('2025-01-05T12:00:00')
    expect(getLinkStatus(partialLink, beforeExpiry)).toBe('Active')
    expect(getLinkStatus({ ...partialLink, amountPaid: 40 }, beforeExpiry)).toBe('Partially paid')
    expect(getLinkStatus({ ...partialLink, amountPaid: 100 }, beforeExpiry)).toBe('Paid')
  })
})

describe('expiry priority and storage compatibility', () => {
  const afterExpiry = new Date('2025-01-11T00:00:00')
  const expired = { ...partialLink, expiresAt: '2025-01-10T23:59:59' }
  it('expires unpaid and partially paid links, while full payment takes priority over expiry', () => {
    expect(getLinkStatus(expired, afterExpiry)).toBe('Expired')
    expect(getLinkStatus({ ...expired, amountPaid: 20 }, afterExpiry)).toBe('Expired')
    expect(getLinkStatus({ ...expired, amountPaid: 100 }, afterExpiry)).toBe('Paid')
    expect(validatePayment(expired, '25')).toMatch(/Expired/)
  })
  it('restores legacy Section 3 links with payment defaults and derives their status', () => {
    const legacy = [{ id: 'legacy', amount: 50, description: 'Old link', contact: { kind: 'phone', value: '+919876543210' }, status: 'Paid', createdAt: '2025-01-01T12:00:00.000Z' }]
    expect(restoreLinks(JSON.stringify(legacy), new Date('2025-01-02'))[0]).toMatchObject({ amountPaid: 50, allowPartialPayments: false, status: 'Paid' })
  })
  it('safely ignores missing, malformed, and invalid stored data', () => {
    expect(restoreLinks(null)).toEqual([])
    expect(restoreLinks('not json')).toEqual([])
    expect(restoreLinks(JSON.stringify([{ id: 'bad' }]))).toEqual([])
  })
})
