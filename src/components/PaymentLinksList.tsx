import { useState } from 'react'
import type { FormEvent } from 'react'
import type { PaymentLink, PaymentStatus } from '../domain/paymentLinks'
import { amountDue, formatDate, formatDateTime, formatRupees } from '../domain/paymentLinks'

export type StatusFilter = 'All' | PaymentStatus
type Props = { links: PaymentLink[]; filter: StatusFilter; onFilter: (filter: StatusFilter) => void; onMarkPaid: (id: string) => void; onRecordPayment: (id: string, amount: string) => string | undefined }
const filters: StatusFilter[] = ['All', 'Active', 'Partially paid', 'Paid', 'Expired']

function PaymentRecorder({ link, onRecordPayment }: { link: PaymentLink; onRecordPayment: Props['onRecordPayment'] }) {
  const [payment, setPayment] = useState('')
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = onRecordPayment(link.id, payment)
    if (result) { setError(result); return }
    setPayment('')
    setError('')
  }
  return <form className="record-payment" onSubmit={submit} noValidate>
    <label htmlFor={`payment-${link.id}`}>Record payment <span>Amount due {formatRupees(amountDue(link))}</span></label>
    <div className="record-payment-controls">
      <div className="amount-input"><span aria-hidden="true">₹</span><input id={`payment-${link.id}`} inputMode="decimal" placeholder="Payment amount" value={payment} onChange={event => setPayment(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `payment-error-${link.id}` : undefined} /></div>
      <button className="record-button" type="submit">Record payment</button>
    </div>
    {error && <p id={`payment-error-${link.id}`} className="field-error" role="alert">{error}</p>}
  </form>
}

export function PaymentLinksList({ links, filter, onFilter, onMarkPaid, onRecordPayment }: Props) {
  const visible = links.filter(link => filter === 'All' || link.status === filter)
  return <section className="links-section" aria-labelledby="links-title">
    <div className="section-top"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="links-title">Payment links <span className="total-count">{links.length}</span></h2></div><button className="icon-button" aria-label="More payment link options" title="More options">···</button></div>
    <div className="filters" role="group" aria-label="Filter payment links">{filters.map(item => <button key={item} className={`filter-chip ${filter === item ? 'selected' : ''}`} aria-pressed={filter === item} onClick={() => onFilter(item)}>{item}<span>{item === 'All' ? links.length : links.filter(l => l.status === item).length}</span></button>)}</div>
    {visible.length === 0 ? <div className="empty-state"><div className="empty-icon" aria-hidden="true">↗</div><h3>{links.length ? `No ${filter.toLowerCase()} links` : 'No payment links yet'}</h3><p>{links.length ? 'Try another status filter to find a payment link.' : 'Create your first payment link to start collecting payments.'}</p></div> : <div className="link-list">{visible.map(link => <article className="link-card" key={link.id}>
      <div className="link-main"><div className="link-symbol" aria-hidden="true">₹</div><div className="link-copy"><div className="amount-line">{formatRupees(link.amount)}<span className={`status-pill ${link.status.toLowerCase().replaceAll(' ', '-')}`}><span aria-hidden="true">●</span>{link.status}</span></div><div className="payment-summary"><span>Paid <strong>{formatRupees(link.amountPaid)}</strong></span><span>Due <strong>{formatRupees(amountDue(link))}</strong></span></div><h3>{link.description}</h3><p>{link.contact.value}</p></div></div>
      <div className="link-meta"><span>Created {formatDateTime(link.createdAt)}</span>{link.expiresAt && <span>Expires {formatDate(link.expiresAt)}</span>}</div>
      {(link.status === 'Active' || link.status === 'Partially paid') && <><PaymentRecorder link={link} onRecordPayment={onRecordPayment} /><button className="mark-paid" onClick={() => onMarkPaid(link.id)} aria-label={`Mark ${link.description} as paid`}>Mark as paid <span aria-hidden="true">↗</span></button></>}
    </article>)}</div>}
  </section>
}
