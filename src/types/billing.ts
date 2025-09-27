// Billing & Invoicing domain types matching backend schema

export type UUID = string;

export type InvoiceStatus = 'Unpaid' | 'Paid' | 'Overdue';

export type PaymentMethod = 'UPI' | 'NEFT' | 'COD' | string;

export interface InvoiceItem {
  id: UUID;
  invoice_id: UUID;
  description: string;
  amount: number; // DECIMAL on backend
}

export interface Payment {
  id: UUID;
  invoice_id: UUID;
  amount: number; // DECIMAL on backend
  payment_date: string; // ISO string timestamp
  payment_method: PaymentMethod; // VARCHAR on backend
}

export interface Invoice {
  id: UUID;
  booking_id: UUID; // FK → bookings.id
  invoice_number: string; // Unique human readable
  total_amount: number; // DECIMAL on backend (denormalized for quick reads)
  due_date: string; // DATE (YYYY-MM-DD) serialized as string
  status: InvoiceStatus; // ENUM
  // Optional expansions included by API for convenience
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface CreateInvoiceInput {
  booking_id: UUID;
  due_date: string; // YYYY-MM-DD
  items: Array<Pick<InvoiceItem, 'description' | 'amount'>>;
}

export interface RecordPaymentInput {
  amount: number;
  payment_date: string; // YYYY-MM-DD or ISO
  payment_method: PaymentMethod;
}

export interface InvoiceFilters {
  status?: InvoiceStatus | 'All';
  query?: string; // search across invoice_number or booking_id
  dueFrom?: string; // YYYY-MM-DD
  dueTo?: string;   // YYYY-MM-DD
}

export function computeTotals(invoice: Invoice) {
  const itemsTotal = (invoice.items ?? []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const paid = (invoice.payments ?? []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  // Prefer denormalized total_amount if present, else sum of items
  const total = Number.isFinite(invoice.total_amount) && invoice.total_amount > 0 ? invoice.total_amount : itemsTotal;
  const balance = Math.max(0, total - paid);
  return { itemsTotal, total, paid, balance };
}

export function deriveStatus(invoice: Invoice): InvoiceStatus {
  const { total, paid } = computeTotals(invoice);
  const today = new Date();
  const due = new Date(invoice.due_date);
  if (paid >= total && total > 0) return 'Paid';
  if (paid < total && due < new Date(today.toDateString())) return 'Overdue';
  return 'Unpaid';
}
