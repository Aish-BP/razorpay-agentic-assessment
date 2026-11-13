import type { PaymentLink, PaymentStatus } from '../domain/paymentLinks'
import { formatDate, formatRupees } from '../domain/paymentLinks'

export type StatusFilter = 'All' | PaymentStatus
type Props = { links: PaymentLink[]; filter: StatusFilter; onFilter: (filter: StatusFilter) => void; onMarkPaid: (id: string) => void }
const filters: StatusFilter[] = ['All', 'Active', 'Paid', 'Expired']

export function PaymentLinksList({ links, filter, onFilter, onMarkPaid }: Props) {
  const visible = links.filter(link => filter === 'All' || link.status === filter)
  return <section className="links-section" aria-labelledby="links-title">
    <div className="section-top"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="links-title">Payment links <span className="total-count">{links.length}</span></h2></div><button className="icon-button" aria-label="More payment link options" title="More options">···</button></div>
    <div className="filters" role="group" aria-label="Filter payment links">{filters.map(item => <button key={item} className={`filter-chip ${filter === item ? 'selected' : ''}`} aria-pressed={filter === item} onClick={() => onFilter(item)}>{item}<span>{item === 'All' ? links.length : links.filter(l => l.status === item).length}</span></button>)}</div>
    {visible.length === 0 ? <div className="empty-state"><div className="empty-icon" aria-hidden="true">↗</div><h3>{links.length ? `No ${filter.toLowerCase()} links` : 'No payment links yet'}</h3><p>{links.length ? 'Try another status filter to find a payment link.' : 'Create your first payment link to start collecting payments.'}</p></div> : <div className="link-list">{visible.map(link => <article className="link-card" key={link.id}>
      <div className="link-main"><div className="link-symbol" aria-hidden="true">₹</div><div className="link-copy"><div className="amount-line">{formatRupees(link.amount)}<span className={`status-pill ${link.status.toLowerCase()}`}><span aria-hidden="true">●</span>{link.status}</span></div><h3>{link.description}</h3><p>{link.contact.value}</p></div></div>
      <div className="link-meta"><span>Created {formatDate(link.createdAt)}</span>{link.expiresAt && <span>Expires {formatDate(link.expiresAt)}</span>}</div>
      {link.status === 'Active' && <button className="mark-paid" onClick={() => onMarkPaid(link.id)} aria-label={`Mark ${link.description} as paid`}>Mark as paid <span aria-hidden="true">↗</span></button>}
    </article>)}</div>}
  </section>
}
