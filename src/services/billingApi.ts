import { CreateInvoiceInput, Invoice, InvoiceFilters, Payment, RecordPaymentInput, UUID, computeTotals, deriveStatus } from '../types/billing';

// Simple localStorage-backed mock until backend is ready.
// All functions are async to match future fetch API contracts.

const STORAGE_KEY = 'tsm.billing.v1';

type Store = {
  invoices: Invoice[];
};

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { invoices: [] };
    return JSON.parse(raw);
  } catch {
    return { invoices: [] };
  }
}

function save(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function uuid(): UUID {
  // RFC4122 v4-ish
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as UUID;
}

function nextInvoiceNumber(existing: Invoice[]): string {
  // Simple incremental INV-YYYY-#### sequence based on current year
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const nums = existing
    .map(i => i.invoice_number)
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.substring(prefix.length), 10))
    .filter(n => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export async function listInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  const store = load();
  let data = [...store.invoices];
  if (filters?.status && filters.status !== 'All') {
    data = data.filter(i => (i.status ?? deriveStatus(i)) === filters.status);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    data = data.filter(i =>
      i.invoice_number.toLowerCase().includes(q) || i.booking_id.toLowerCase().includes(q)
    );
  }
  if (filters?.dueFrom) {
    data = data.filter(i => i.due_date >= filters.dueFrom!);
  }
  if (filters?.dueTo) {
    data = data.filter(i => i.due_date <= filters.dueTo!);
  }
  // Ensure denormalized totals/status are accurate
  return data.map(i => ({ ...i, status: deriveStatus(i), total_amount: computeTotals(i).total }));
}

export async function getInvoice(id: UUID): Promise<Invoice | null> {
  const store = load();
  const inv = store.invoices.find(i => i.id === id) || null;
  return inv ? { ...inv, status: deriveStatus(inv), total_amount: computeTotals(inv).total } : null;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const store = load();
  const id = uuid();
  const invoiceNum = nextInvoiceNumber(store.invoices);
  const items = input.items.map(it => ({ id: uuid(), invoice_id: id, description: it.description, amount: Number(it.amount) }));
  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const invoice: Invoice = {
    id,
    booking_id: input.booking_id,
    invoice_number: invoiceNum,
    total_amount: total,
    due_date: input.due_date,
    status: 'Unpaid',
    items,
    payments: [],
  };
  store.invoices.push(invoice);
  save(store);
  return invoice;
}

export async function addInvoiceItem(invoiceId: UUID, description: string, amount: number): Promise<Invoice> {
  const store = load();
  const inv = store.invoices.find(i => i.id === invoiceId);
  if (!inv) throw new Error('Invoice not found');
  const item = { id: uuid(), invoice_id: invoiceId, description, amount: Number(amount) };
  inv.items = [...(inv.items ?? []), item];
  inv.total_amount = computeTotals(inv).itemsTotal;
  inv.status = deriveStatus(inv);
  save(store);
  return inv;
}

export async function recordPayment(invoiceId: UUID, input: RecordPaymentInput): Promise<Invoice> {
  const store = load();
  const inv = store.invoices.find(i => i.id === invoiceId);
  if (!inv) throw new Error('Invoice not found');
  const payment: Payment = {
    id: uuid(),
    invoice_id: invoiceId,
    amount: Number(input.amount),
    payment_date: new Date(input.payment_date).toISOString(),
    payment_method: input.payment_method,
  };
  inv.payments = [...(inv.payments ?? []), payment];
  const { total, paid } = computeTotals(inv);
  inv.total_amount = total;
  inv.status = paid >= total ? 'Paid' : deriveStatus(inv);
  save(store);
  return inv;
}

export async function deleteInvoice(invoiceId: UUID): Promise<void> {
  const store = load();
  store.invoices = store.invoices.filter(i => i.id !== invoiceId);
  save(store);
}

// Placeholder: when backend is ready, swap implementations to use fetch
// const API_BASE = import.meta.env.VITE_API_BASE_URL;
// export async function listInvoices(...) {
//   const res = await fetch(`${API_BASE}/invoices?...`);
//   return res.json();
// }
