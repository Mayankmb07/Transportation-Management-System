import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { Invoice, UUID, computeTotals } from '../types/billing';
import { getInvoice } from '../services/billingApi';
import { exportElementToPDF } from '../utils/pdf';
import { printElement } from '../utils/print';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [taxPct, setTaxPct] = useState(18); // default GST 18%
  const [discount, setDiscount] = useState(0);
  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const inv = await getInvoice(id as UUID);
      setInvoice(inv);
    })();
  }, [id]);

  const totals = useMemo(() => {
    if (!invoice) return { subtotal: 0, tax: 0, discount: 0, grand: 0, paid: 0, balance: 0 };
    const base = computeTotals(invoice);
    const tax = (base.total * taxPct) / 100;
    const grand = Math.max(0, base.total + tax - discount);
    const balance = Math.max(0, grand - base.paid);
    return { subtotal: base.total, tax, discount, grand, paid: base.paid, balance };
  }, [invoice, taxPct, discount]);

  if (!invoice) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm text-gray-300">
        Loading invoice...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/billing')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" /> Back to Billing
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (printRef.current) printElement(printRef.current, invoice.invoice_number) }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800"><Printer className="w-4 h-4"/> Print</button>
          <button onClick={() => { if (printRef.current) exportElementToPDF(printRef.current, `${invoice.invoice_number}.pdf`) }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"><Download className="w-4 h-4"/> PDF</button>
        </div>
      </div>

      <div ref={printRef} className="bg-white rounded-xl border shadow-sm p-8">
        {/* Header / Company */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Company" className="w-12 h-12" />
            <div>
              <div className="text-2xl font-bold text-gray-900">TransportMS Pvt Ltd</div>
              <div className="text-gray-500 text-sm">12th Floor, Tech Park, Bengaluru, KA 560001</div>
              <div className="text-gray-500 text-sm">GSTIN: 29ABCDE1234F1Z5</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">Invoice</div>
            <div className="text-gray-500">{invoice.invoice_number}</div>
            <div className="text-gray-500 text-sm">Due: {invoice.due_date}</div>
          </div>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div>
            <div className="text-gray-600 text-sm">Bill To</div>
            <div className="font-medium">Customer Name</div>
            <div className="text-sm text-gray-600">Customer Address Line 1</div>
            <div className="text-sm text-gray-600">City, State, Pincode</div>
          </div>
          <div className="md:text-right">
            <div className="text-gray-600 text-sm">Booking ID</div>
            <div className="font-medium">{invoice.booking_id}</div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items ?? []).map(it => (
                <tr key={it.id} className="border-t">
                  <td className="py-2 pr-4">{it.description}</td>
                  <td className="py-2 text-right">{currency(Number(it.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals with tax & discount */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm text-gray-600">
            <div>Payment Terms: Within 15 days</div>
            <div>Support: accounts@transportms.example</div>
          </div>
          <div>
            <div className="flex items-center justify-end gap-2 text-sm mb-2">
              <label>Tax %</label>
              <input type="number" className="border rounded px-2 py-1 w-20" value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} />
              <label>Discount</label>
              <input type="number" className="border rounded px-2 py-1 w-24" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Row label="Subtotal" value={currency(totals.subtotal)} />
              <Row label={`Tax (${taxPct}%)`} value={currency(totals.tax)} />
              <Row label="Discount" value={`- ${currency(totals.discount)}`} />
              <div className="border-t my-2" />
              <Row label="Grand Total" value={currency(totals.grand)} bold />
              <Row label="Paid" value={currency(totals.paid)} />
              <Row label="Balance Due" value={currency(totals.balance)} bold />
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">This is a system generated invoice. No signature required.</div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1">
      <div className={`text-gray-600 ${bold ? 'font-medium' : ''}`}>{label}</div>
      <div className={`${bold ? 'font-semibold' : ''}`}>{value}</div>
    </div>
  );
}

const currency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
