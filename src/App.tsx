import { useEffect, useMemo, useState } from 'react'
import { CreateLinkForm } from './components/CreateLinkForm'
import { PaymentLinksList, type StatusFilter } from './components/PaymentLinksList'
import { getLinkStatus, type LinkDraft, type PaymentLink } from './domain/paymentLinks'
import './styles.css'

const STORAGE_KEY = 'razorpay-payment-links-v1'
function loadLinks(): PaymentLink[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as PaymentLink[] } catch { return [] }
}
function App() {
  const [links, setLinks] = useState<PaymentLink[]>(loadLinks)
  const [filter, setFilter] = useState<StatusFilter>('All')
  const [notice, setNotice] = useState('')
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  }, [links])
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const currentLinks = useMemo(() => links.map(link => {
    const status = getLinkStatus(link, clock)
    return status === link.status ? link : { ...link, status }
  }), [links, clock])
  useEffect(() => {
    if (currentLinks.some((link, index) => link.status !== links[index]?.status)) setLinks(currentLinks)
  }, [currentLinks, links])

  function createLink(draft: LinkDraft) {
    const isEmail = draft.contact.trim().includes('@')
    const created: PaymentLink = {
      id: crypto.randomUUID(), amount: Number(draft.amount), description: draft.description.trim(),
      contact: { kind: isEmail ? 'email' : 'phone', value: draft.contact.trim() }, status: 'Active',
      createdAt: new Date().toISOString(), ...(draft.expiry ? { expiresAt: `${draft.expiry}T23:59:59` } : {}),
    }
    setLinks(previous => [created, ...previous])
    setFilter('All')
    setNotice(`Payment link created for ₹${created.amount.toLocaleString('en-IN')}.`)
    window.setTimeout(() => setNotice(''), 5000)
  }
  function markPaid(id: string) {
    setLinks(previous => previous.map(link => link.id === id ? { ...link, status: 'Paid' } : link))
    setNotice('Payment link marked as paid.')
    window.setTimeout(() => setNotice(''), 5000)
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#home" aria-label="Razorpay home"><span className="brand-mark" aria-hidden="true">R</span><span>razorpay</span></a><nav aria-label="Main navigation"><a href="#overview">Overview</a><a href="#payments">Payments</a><a className="nav-active" href="#links" aria-current="page">Payment Links</a></nav><button className="profile-button" aria-label="Account menu">AS</button></header>
    <main id="home"><div className="page-heading"><div><div className="breadcrumb">Payments <span>/</span> Payment Links</div><h1>Payment Links</h1><p>Create and share links to accept payments instantly.</p></div><div className="page-decoration" aria-hidden="true"><span>↗</span></div></div>
      {notice && <div className="success-banner" role="status"><span aria-hidden="true">✓</span>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
      <div className="dashboard-grid"><aside className="form-column"><CreateLinkForm onCreate={createLink} /><div className="help-card"><span className="help-icon" aria-hidden="true">✦</span><div><strong>Simple, secure payments</strong><p>Share your link anywhere. Your customers can pay using their preferred method.</p></div></div></aside><div id="links" className="list-column"><PaymentLinksList links={currentLinks} filter={filter} onFilter={setFilter} onMarkPaid={markPaid} /></div></div>
    </main><footer><span>© Razorpay · Payment Links</span><span>Secure payments, made simple <span aria-hidden="true">✦</span></span></footer>
  </div>
}
export default App
