export const API_BASE = 'https://tailor-ts-api.onrender.com';

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Measurement {
  id: number;
  customerId: number;
  label?: string | null;
  height?: number | null;
  shoulder?: number | null;
  chest?: number | null;
  waist?: number | null;
  sleeve?: number | null;
  wrist?: number | null;
  neck?: number | null;
  hip?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  customerId: number;
  measurementId?: number | null;
  fabricType?: string | null;
  priceBeforeVat: number;
  vatAmount: number;
  totalAmount: number;
  deliveryDate?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  customer?: Customer;
  measurement?: Measurement;
   invoice?: Invoice; 
}
export interface Invoice {
  id: number;
  orderId: number;
  internalCode: string;
  issueDate: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  invoiceType: string;
  vatCategory: string;
  currency: string;
}

export interface EInvoice {
  id: number;
  invoiceId: number;
  uuid?: string | null;
  xmlUrl?: string | null;
  pdfUrl?: string | null;
  qrData?: string | null;
  providerStatus?: string | null;
  providerRawResp?: string | null;
  createdAt: string;
}

export interface PrintData {
  customerInvoice: any;
  tailorSlip: any;
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/customers`);
  if (!res.ok) throw new Error('فشل في جلب العملاء');
  return res.json();
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  notes?: string;
}): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء العميل');
  return res.json();
}

export async function getMeasurements(customerId: number): Promise<Measurement[]> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/measurements`);
  if (!res.ok) throw new Error('فشل في جلب المقاسات');
  return res.json();
}

export async function createMeasurement(
  customerId: number,
  data: Partial<Measurement>,
): Promise<Measurement> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في حفظ المقاسات');
  return res.json();
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('فشل في جلب الطلبات');
  return res.json();
}

export async function createOrder(data: {
  customerId: number;
  measurementId?: number | null;
  fabricType?: string;
  priceBeforeVat: number;
  deliveryDate?: string;
  notes?: string;
}): Promise<{ order: Order; invoice: any }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء الطلب');
  return res.json();
}

export async function getPrintData(orderId: number): Promise<PrintData> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/print`);
  if (!res.ok) throw new Error('فشل في جلب بيانات الطباعة');
  return res.json();
}
export async function issueEInvoice(orderId: number): Promise<{
  invoice: Invoice;
  order: { id: number; customerName: string };
  shop: { name?: string | null; vatNumber?: string | null };
  einvoice: EInvoice;
}> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/einvoice`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('فشل في إصدار الفاتورة الإلكترونية');
  return res.json();
}
