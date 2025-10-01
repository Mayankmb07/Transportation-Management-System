import React from 'react';

type Invoice = {
  id: string;
  booking_id: string;
  invoice_number: string;
  total_amount: number;
  due_date: string | Date;
  status: 'Unpaid' | 'Paid' | 'Overdue';
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  amount: number;
};

type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string | Date;
  payment_method: string;
};

type Props = {
  invoice: Invoice;
  items?: InvoiceItem[];
  payments?: Payment[];
  company?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    gstin?: string;
  };
  customer?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
};

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const fmtDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (!date || Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
};

export default function InvoicePrintView({ invoice, items = [], payments = [], company, customer }: Props) {
  const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, subtotal - paid);

  return (
    <div className="bg-white text-gray-900 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-md bg-indigo-600 text-white flex items-center justify-center font-semibold">
              TSM
            </div>
          )}
          <div>
            <div className="text-xl font-semibold">{company?.name || 'Transportation Management System'}</div>
            <div className="text-sm text-gray-500">
              {company?.address || 'Company address'} · {company?.phone || '+91-000-000-0000'} · {company?.email || 'info@example.com'}
            </div>
            {company?.gstin && <div className="text-xs text-gray-500">GSTIN: {company.gstin}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tracking-wide">INVOICE</div>
          <div className="text-sm text-gray-500 mt-1">#{invoice.invoice_number}</div>
        </div>
      </div>

      {/* Parties + Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Billed To</div>
          <div className="mt-1">
            <div className="font-medium">{customer?.name || 'Customer Name'}</div>
            <div className="text-sm text-gray-500">{customer?.address || 'Customer address'}</div>
            {(customer?.phone || customer?.email) && (
              <div className="text-sm text-gray-500">
                {customer.phone}{customer?.phone && customer?.email ? ' · ' : ''}{customer.email}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Booking ID</div>
          <div className="font-medium">{invoice.booking_id}</div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mt-3">Due Date</div>
          <div className="font-medium">{fmtDate(invoice.due_date)}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 mt-1 rounded-full text-xs font-medium
            ${invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              invoice.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full
              ${invoice.status === 'Paid' ? 'bg-emerald-500' :
                invoice.status === 'Overdue' ? 'bg-rose-500' : 'bg-amber-500'}`} />
            {invoice.status}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-8">
        <div className="text-sm font-semibold text-gray-700 mb-3">Invoice Items</div>
        <div className="overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No items added</td>
                </tr>
              ) : items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{it.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{inr.format(Number(it.amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-6 flex flex-col md:flex-row md:items-start md:justify-end gap-6">
        <div className="w-full md:w-80 rounded-xl border p-4 bg-gray-50">
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-medium">{inr.format(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-sm text-gray-600">Paid</span>
            <span className="text-sm font-medium text-emerald-700">{inr.format(paid)}</span>
          </div>
          <div className="flex justify-between py-2 border-t mt-2">
            <span className="text-sm font-semibold text-gray-800">Balance Due</span>
            <span className="text-sm font-semibold">{inr.format(balance)}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="mt-8">
        <div className="text-sm font-semibold text-gray-700 mb-3">Payments</div>
        <div className="overflow-hidden rounded-xl border">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No payments recorded</td>
                </tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">{fmtDate(p.payment_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.payment_method}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{inr.format(Number(p.amount) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-8 border-t pt-4 text-xs text-gray-500">
        Terms: Payment due by the due date. Late invoices may incur charges. For queries, contact support.
      </div>
    </div>
  );
}