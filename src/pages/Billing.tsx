import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, IndianRupee, Download, ChevronRight, Trash2, CreditCard } from 'lucide-react';
import { Invoice, InvoiceFilters, InvoiceItem, InvoiceStatus, PaymentMethod, UUID, computeTotals } from '../types/billing';
import { createInvoice, deleteInvoice, listInvoices, recordPayment } from '../services/billingApi';

// Small reusable UI primitives
function Badge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    Paid: 'bg-green-100 text-green-700 border-green-300',
    Unpaid: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Overdue: 'bg-red-100 text-red-700 border-red-300',
  };
  return <span className={`px-2 py-1 rounded-full text-xs border ${styles[status]}`}>{status}</span>;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl border border-gray-200">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function BillingPage() {
  const [filters, setFilters] = useState<InvoiceFilters>({ status: 'All' });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPayFor, setShowPayFor] = useState<Invoice | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listInvoices(filters);
        if (alive) setInvoices(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false };
  }, [filters]);

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + (computeTotals(i).total || 0), 0);
    const paid = invoices.reduce((s, i) => s + (computeTotals(i).paid || 0), 0);
    const balance = Math.max(0, total - paid);
    return { total, paid, balance };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <ReceiptIcon />
          <h2 className="text-2xl font-bold">Billing & Invoicing</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
          <button className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Billed" value={currency(totals.total)} icon={IndianRupee} color="bg-blue-600" />
        <StatCard label="Total Received" value={currency(totals.paid)} icon={CreditCard} color="bg-emerald-600" />
        <StatCard label="Outstanding" value={currency(totals.balance)} icon={ChevronRight} color="bg-amber-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search invoice # or booking id"
              value={filters.query ?? ''}
              onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
            />
          </div>
          <select
            className="border rounded-lg px-3 py-2"
            value={filters.status ?? 'All'}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any }))}
          >
            {['All', 'Unpaid', 'Paid', 'Overdue'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="date" className="border rounded-lg px-3 py-2" value={filters.dueFrom ?? ''} onChange={(e) => setFilters(f => ({ ...f, dueFrom: e.target.value }))} />
          <input type="date" className="border rounded-lg px-3 py-2" value={filters.dueTo ?? ''} onChange={(e) => setFilters(f => ({ ...f, dueTo: e.target.value }))} />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-6 py-3">Invoice</th>
              <th className="px-6 py-3">Booking</th>
              <th className="px-6 py-3">Due Date</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Paid</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={8}>Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={8}>No invoices yet. Create one to get started.</td></tr>
            ) : (
              invoices.map(inv => {
                const { total, paid, balance } = computeTotals(inv);
                return (
                  <tr key={inv.id} className="border-t text-sm">
                    <td className="px-6 py-3 font-medium">{inv.invoice_number}</td>
                    <td className="px-6 py-3 text-gray-600">{inv.booking_id}</td>
                    <td className="px-6 py-3">{inv.due_date}</td>
                    <td className="px-6 py-3">{currency(total)}</td>
                    <td className="px-6 py-3">{currency(paid)}</td>
                    <td className="px-6 py-3">{currency(balance)}</td>
                    <td className="px-6 py-3"><Badge status={inv.status} /></td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowPayFor(inv)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Record Payment</button>
                        <button onClick={() => handleDelete(inv.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onCreated={(i) => { setShowCreate(false); setInvoices(v => [i, ...v]); }} />}
      {showPayFor && <RecordPaymentModal invoice={showPayFor} onClose={() => setShowPayFor(null)} onSaved={(i) => { setShowPayFor(null); setInvoices(v => v.map(x => x.id === i.id ? i : x)) }} />}
    </div>
  );

  async function handleDelete(id: UUID) {
    if (!confirm('Delete this invoice?')) return;
    await deleteInvoice(id);
    setInvoices(v => v.filter(i => i.id !== id));
  }
}

function ReceiptIcon() {
  return (
    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
      <FileSvg />
    </div>
  )
}

function FileSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6" className="opacity-70"/>
    </svg>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (inv: Invoice) => void }) {
  const [bookingId, setBookingId] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0,10));
  const [items, setItems] = useState<Array<Pick<InvoiceItem, 'description' | 'amount'>>>([{ description: '', amount: 0 }]);
  const total = useMemo(() => items.reduce((s, it) => s + Number(it.amount || 0), 0), [items]);

  return (
    <Modal title="Create Invoice" onClose={onClose}>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const clean = items.filter(it => it.description.trim() && Number(it.amount) > 0);
        const inv = await createInvoice({ booking_id: bookingId || 'BOOKING-ID', due_date: dueDate, items: clean });
        onCreated(inv);
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Booking ID</label>
            <input value={bookingId} onChange={e => setBookingId(e.target.value)} placeholder="e.g. BK-2025-0001" className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <p className="text-xs text-gray-500 mt-1">Will relate to bookings.id in backend</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 font-medium">Line Items</label>
            <button type="button" onClick={() => setItems(v => [...v, { description: '', amount: 0 }])} className="text-blue-600 text-sm hover:underline">Add Item</button>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input
                className="col-span-8 border rounded-lg px-3 py-2"
                placeholder="Description"
                value={it.description}
                onChange={e => setItems(v => v.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
              />
              <input
                type="number"
                step="0.01"
                className="col-span-3 border rounded-lg px-3 py-2"
                placeholder="Amount"
                value={it.amount}
                onChange={e => setItems(v => v.map((x, i) => i === idx ? { ...x, amount: Number(e.target.value) } : x))}
              />
              <button type="button" onClick={() => setItems(v => v.filter((_, i) => i !== idx))} className="col-span-1 p-2 text-gray-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-end text-sm text-gray-600">
            <span className="mr-2">Subtotal:</span>
            <span className="font-semibold">{currency(total)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Create Invoice</button>
        </div>
      </form>
    </Modal>
  );
}

function RecordPaymentModal({ invoice, onClose, onSaved }: { invoice: Invoice; onClose: () => void; onSaved: (i: Invoice) => void }) {
  const { total, paid, balance } = computeTotals(invoice);
  const [amount, setAmount] = useState(balance);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  return (
    <Modal title={`Record Payment • ${invoice.invoice_number}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <div className="flex justify-between"><span>Total</span><span className="font-medium">{currency(total)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span className="font-medium">{currency(paid)}</span></div>
          <div className="flex justify-between"><span>Balance</span><span className="font-medium">{currency(balance)}</span></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600">Amount</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2">
              {['UPI','NEFT','COD','Card','Cash','Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button onClick={async () => { const updated = await recordPayment(invoice.id, { amount, payment_date: date, payment_method: method }); onSaved(updated); }} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Save Payment</button>
        </div>
      </div>
    </Modal>
  );
}
