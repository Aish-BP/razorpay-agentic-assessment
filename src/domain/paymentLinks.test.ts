import { describe, expect, it } from 'vitest'
import { getLinkStatus, validateDraft, type LinkDraft, type PaymentLink } from './paymentLinks'

const valid: LinkDraft = { amount: '1250.50', description: 'Design retainer', contact: 'buyer@example.com', expiry: '' }

describe('payment link validation', () => {
  it('accepts a valid draft and allows phone contacts', () => {
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
  it('requires the optional expiry to be in the future', () => {
    expect(validateDraft({ ...valid, expiry: '2020-01-01' }, new Date('2024-01-01')).expiry).toMatch(/future/)
  })
})

describe('payment link status', () => {
  const link: PaymentLink = { id: '1', amount: 20, description: 'Invoice', contact: { kind: 'email', value: 'a@b.com' }, status: 'Active', createdAt: '2025-01-01T00:00:00.000Z', expiresAt: '2025-01-10T23:59:59' }
  it('expires unpaid links after expiry and keeps paid links paid', () => {
    const afterExpiry = new Date('2025-01-11T00:00:00')
    expect(getLinkStatus(link, afterExpiry)).toBe('Expired')
    expect(getLinkStatus({ ...link, status: 'Paid' }, afterExpiry)).toBe('Paid')
  })
  it('keeps links active until their expiry time', () => {
    expect(getLinkStatus(link, new Date('2025-01-10T12:00:00'))).toBe('Active')
  })
})
