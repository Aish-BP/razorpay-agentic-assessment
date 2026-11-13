import { useState } from 'react'
import type { FormEvent } from 'react'
import type { FormErrors, LinkDraft } from '../domain/paymentLinks'
import { validateDraft } from '../domain/paymentLinks'

const initialDraft: LinkDraft = { amount: '', description: '', contact: '', expiry: '', allowPartialPayments: false, minimumFirstPayment: '' }
type Props = { onCreate: (draft: LinkDraft) => void }

export function CreateLinkForm({ onCreate }: Props) {
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const update = (field: keyof LinkDraft, value: string | boolean) => {
    const next = { ...draft, [field]: value }
    setDraft(next)
    if (submitted) setErrors(validateDraft(next))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)
    setSubmitted(true)
    if (Object.keys(nextErrors).length) return
    onCreate(draft)
    setDraft(initialDraft)
    setErrors({})
    setSubmitted(false)
  }
  return <form className="create-form" onSubmit={submit} noValidate aria-label="Create payment link">
    <div className="form-heading"><div><span className="eyebrow">NEW PAYMENT LINK</span><h2>Create a link</h2></div><span className="step-badge" aria-hidden="true">↗</span></div>
    <div className="field">
      <label htmlFor="amount">Amount <span className="required">*</span></label>
      <div className={`amount-input ${errors.amount ? 'has-error' : ''}`}><span aria-hidden="true">₹</span><input id="amount" name="amount" inputMode="decimal" placeholder="0.00" value={draft.amount} onChange={e => update('amount', e.target.value)} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'} /></div>
      {errors.amount ? <p id="amount-error" className="field-error" role="alert">{errors.amount}</p> : <p id="amount-hint" className="field-hint">Maximum amount ₹5,00,000</p>}
    </div>
    <div className="field">
      <div className="label-row"><label htmlFor="description">Description <span className="required">*</span></label><span className="counter">{draft.description.length}/100</span></div>
      <input id="description" name="description" maxLength={101} placeholder="e.g. Website design services" value={draft.description} onChange={e => update('description', e.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined} />
      {errors.description && <p id="description-error" className="field-error" role="alert">{errors.description}</p>}
    </div>
    <div className="field">
      <label htmlFor="contact">Customer email or phone <span className="required">*</span></label>
      <input id="contact" name="contact" autoComplete="email" placeholder="name@example.com or +91 98765 43210" value={draft.contact} onChange={e => update('contact', e.target.value)} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? 'contact-error' : undefined} />
      {errors.contact && <p id="contact-error" className="field-error" role="alert">{errors.contact}</p>}
    </div>
    <div className="partial-toggle">
      <input id="allowPartialPayments" name="allowPartialPayments" type="checkbox" checked={draft.allowPartialPayments} onChange={e => update('allowPartialPayments', e.target.checked)} />
      <label htmlFor="allowPartialPayments"><span>Allow partial payments</span><small>Let your customer pay in multiple instalments</small></label>
    </div>
    {draft.allowPartialPayments && <div className="field minimum-payment-field">
      <label htmlFor="minimumFirstPayment">Minimum first payment <span className="required">*</span></label>
      <div className={`amount-input ${errors.minimumFirstPayment ? 'has-error' : ''}`}><span aria-hidden="true">₹</span><input id="minimumFirstPayment" name="minimumFirstPayment" inputMode="decimal" placeholder="0.00" value={draft.minimumFirstPayment} onChange={e => update('minimumFirstPayment', e.target.value)} aria-invalid={Boolean(errors.minimumFirstPayment)} aria-describedby={errors.minimumFirstPayment ? 'minimum-first-payment-error' : undefined} /></div>
      {errors.minimumFirstPayment && <p id="minimum-first-payment-error" className="field-error" role="alert">{errors.minimumFirstPayment}</p>}
    </div>}
    <div className="field">
      <label htmlFor="expiry">Expiry date <span className="optional">OPTIONAL</span></label>
      <input id="expiry" name="expiry" type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} value={draft.expiry} onChange={e => update('expiry', e.target.value)} aria-invalid={Boolean(errors.expiry)} aria-describedby={errors.expiry ? 'expiry-error' : undefined} />
      {errors.expiry && <p id="expiry-error" className="field-error" role="alert">{errors.expiry}</p>}
    </div>
    <button className="primary-button" type="submit">Create payment link <span aria-hidden="true">→</span></button>
    <p className="secure-note"><span aria-hidden="true">⌑</span> Secure, shareable payment link</p>
  </form>
}
