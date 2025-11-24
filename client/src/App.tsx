import React, { useEffect, useState } from 'react';
import './App.css';
import {
  getCustomers,
  createCustomer,
  getMeasurements,
  createMeasurement,
  getOrders,
  createOrder,
  getPrintData,
  issueEInvoice,
} from './api';

import type {
  Customer,
  Measurement,
  Order,
  PrintData,
  EInvoice,
  Invoice,
} from './api';

import { QRCodeCanvas } from 'qrcode.react';

type Tab = 'customers' | 'orders' | 'print';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [externalOrderId, setExternalOrderId] = useState<string>(''); // 👈 جديد

  return (
    <div dir="rtl" className="app-root">

      <header className="app-header">
        <h1>نظام الخياطة (v0.1)</h1>
        <nav>
          <button
            className={activeTab === 'customers' ? 'active' : ''}
            onClick={() => setActiveTab('customers')}
          >
            العملاء والمقاسات
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            الطلبات
          </button>
          <button
            className={activeTab === 'print' ? 'active' : ''}
            onClick={() => setActiveTab('print')}
          >
            الطباعة
          </button>
        </nav>
      </header>

    <main className="app-main">
  {activeTab === 'customers' && <CustomersAndMeasurements />}

  {activeTab === 'orders' && (
    <OrdersPage
      setActiveTab={setActiveTab}
      setExternalOrderId={setExternalOrderId}
    />
  )}

  {activeTab === 'print' && (
    <PrintPage externalOrderId={externalOrderId} />
  )}
</main>


    </div>
  );
};

/* =========================
   صفحة العملاء والمقاسات
   ========================= */

const CustomersAndMeasurements: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [custForm, setCustForm] = useState({ name: '', phone: '', notes: '' });
  const [measForm, setMeasForm] = useState({
    label: '',
    height: '',
    shoulder: '',
    chest: '',
    waist: '',
    sleeve: '',
    wrist: '',
    neck: '',
    hip: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      if (data.length && !selectedCustomer) {
        setSelectedCustomer(data[0]);
        loadMeasurements(data[0].id);
      }
    } catch (e) {
      console.error(e);
      alert('فشل في جلب العملاء');
    } finally {
      setLoading(false);
    }
  }

  async function loadMeasurements(customerId: number) {
    try {
      const data = await getMeasurements(customerId);
      setMeasurements(data);
    } catch (e) {
      console.error(e);
      alert('فشل في جلب المقاسات');
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!custForm.name.trim()) {
      alert('الاسم مطلوب');
      return;
    }
    try {
      const c = await createCustomer(custForm);
      setCustForm({ name: '', phone: '', notes: '' });
      await loadCustomers();
      setSelectedCustomer(c);
      loadMeasurements(c.id);
    } catch (e) {
      console.error(e);
      alert('فشل في إنشاء العميل');
    }
  }

  async function handleCreateMeasurement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('اختر عميل أولاً');
      return;
    }
    try {
      const payload: any = {
        label: measForm.label || undefined,
        notes: measForm.notes || undefined,
      };
      ['height', 'shoulder', 'chest', 'waist', 'sleeve', 'wrist', 'neck', 'hip'].forEach(
        (key) => {
          const v = (measForm as any)[key];
          if (v !== '') payload[key] = Number(v);
        },
      );

      await createMeasurement(selectedCustomer.id, payload);
      setMeasForm({
        label: '',
        height: '',
        shoulder: '',
        chest: '',
        waist: '',
        sleeve: '',
        wrist: '',
        neck: '',
        hip: '',
        notes: '',
      });
      loadMeasurements(selectedCustomer.id);
    } catch (e) {
      console.error(e);
      alert('فشل في حفظ المقاسات');
    }
  }

  return (
    <div className="card">
      <h2>العملاء والمقاسات</h2>

      <div className="row">
        <span className="badge">
          {loading ? 'جارٍ التحميل...' : `عدد العملاء: ${customers.length}`}
        </span>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        {/* قائمة العملاء */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3>العملاء</h3>

        <div className="list">
  {customers.map((c) => (
    <div
      key={c.id}
      className={`list-item ${selectedCustomer?.id === c.id ? 'selected' : ''}`}
      onClick={() => {
        setSelectedCustomer(c);
        loadMeasurements(c.id);
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>
          {c.name}
        </span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          📞 {c.phone || 'بدون جوال'}
        </span>
        {c.notes && (
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            📝 {c.notes}
          </span>
        )}
      </div>
      <span className="badge"># {c.id}</span>
    </div>
  ))}

  {!customers.length && (
    <div style={{ padding: 8, fontSize: 13, color: '#6b7280' }}>
      لا يوجد عملاء بعد.
    </div>
  )}
</div>


         <form onSubmit={handleCreateCustomer} style={{ marginTop: 8 }}>
  <h4>إضافة عميل جديد</h4>
  <div className="row">
    <label>الاسم:</label>
    <input
      value={custForm.name}
      onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
    />
  </div>
  <div className="row">
    <label>الجوال:</label>
    <input
      value={custForm.phone}
      onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
    />
  </div>
  <div className="row">
    <label>ملاحظات:</label>
    <textarea
      rows={2}
      value={custForm.notes}
      onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })}
    />
  </div>
  <button className="btn btn-primary" type="submit">
    حفظ العميل
  </button>
</form>

        </div>

        {/* المقاسات */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3>{selectedCustomer ? `المقاسات (${selectedCustomer.name})` : 'المقاسات'}</h3>
         
         
          <div className="list" style={{ marginBottom: 8 }}>
  {measurements.map((m) => (
    <div key={m.id} className="list-item">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          <strong>{m.label || 'بدون اسم'}</strong>
          <span style={{ color: '#6b7280', fontSize: 11 }}>
            #{m.id} • {new Date(m.createdAt).toLocaleDateString('ar-SA')}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>
          ط: {m.height ?? '-'} / ك: {m.shoulder ?? '-'} / ص: {m.chest ?? '-'} / و: {m.waist ?? '-'}
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>
          كم: {m.sleeve ?? '-'} / معصم: {m.wrist ?? '-'} / رقبة: {m.neck ?? '-'} / ورك: {m.hip ?? '-'}
        </div>
        {m.notes && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            📝 {m.notes}
          </div>
        )}
      </div>
    </div>
  ))}

  {!measurements.length && (
    <div style={{ padding: 8, fontSize: 13, color: '#6b7280' }}>
      لا توجد مقاسات بعد لهذا العميل.
    </div>
  )}
</div>



          <form onSubmit={handleCreateMeasurement}>
            <h4>إضافة مقاسات جديدة</h4>
            <div className="row">
              <label>الاسم (مثلاً: صيفي):</label>
              <input
                value={measForm.label}
                onChange={(e) => setMeasForm({ ...measForm, label: e.target.value })}
              />
            </div>
            <div className="row">
              <label>الطول:</label>
              <input
                type="number"
                value={measForm.height}
                onChange={(e) => setMeasForm({ ...measForm, height: e.target.value })}
              />
              <label>الكتف:</label>
              <input
                type="number"
                value={measForm.shoulder}
                onChange={(e) => setMeasForm({ ...measForm, shoulder: e.target.value })}
              />
              <label>الصدر:</label>
              <input
                type="number"
                value={measForm.chest}
                onChange={(e) => setMeasForm({ ...measForm, chest: e.target.value })}
              />
            </div>
            <div className="row">
              <label>الوسط:</label>
              <input
                type="number"
                value={measForm.waist}
                onChange={(e) => setMeasForm({ ...measForm, waist: e.target.value })}
              />
              <label>الكم:</label>
              <input
                type="number"
                value={measForm.sleeve}
                onChange={(e) => setMeasForm({ ...measForm, sleeve: e.target.value })}
              />
              <label>المعصم:</label>
              <input
                type="number"
                value={measForm.wrist}
                onChange={(e) => setMeasForm({ ...measForm, wrist: e.target.value })}
              />
            </div>
            <div className="row">
              <label>الرقبة:</label>
              <input
                type="number"
                value={measForm.neck}
                onChange={(e) => setMeasForm({ ...measForm, neck: e.target.value })}
              />
              <label>الورك:</label>
              <input
                type="number"
                value={measForm.hip}
                onChange={(e) => setMeasForm({ ...measForm, hip: e.target.value })}
              />
            </div>
            <div className="row">
              <label>ملاحظات:</label>
              <textarea
                rows={2}
                value={measForm.notes}
                onChange={(e) => setMeasForm({ ...measForm, notes: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              حفظ المقاسات
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* =========================
   صفحة الطلبات (كاملة v0.1 + فاتورة إلكترونية)
   ========================= */

const OrdersPage: React.FC<{
  setActiveTab: (tab: Tab) => void;
  setExternalOrderId: (id: string) => void;
}> = ({ setActiveTab, setExternalOrderId }) => {

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string>('');
  const [fabricType, setFabricType] = useState('');
  const [priceBeforeVat, setPriceBeforeVat] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [creating, setCreating] = useState(false);

  // 🔹 حالة إصدار الفاتورة الإلكترونية
  const [issuingForId, setIssuingForId] = useState<number | null>(null);
  const [einvoiceData, setEinvoiceData] = useState<{
    invoice: Invoice;
    order: { id: number; customerName: string };
    shop: { name?: string | null; vatNumber?: string | null };
    einvoice: EInvoice;
  } | null>(null);

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
      alert('فشل في جلب الطلبات');
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadCustomers() {
    setLoadingCustomers(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      // اختر أول عميل تلقائيًا
      if (data.length && !selectedCustomerId) {
        const idStr = String(data[0].id);
        setSelectedCustomerId(idStr);
        loadMeasurementsForCustomer(data[0].id);
      }
    } catch (e) {
      console.error(e);
      alert('فشل في جلب العملاء');
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadMeasurementsForCustomer(customerId: number) {
    setLoadingMeasurements(true);
    try {
      const data = await getMeasurements(customerId);
      setMeasurements(data);
      if (data.length) {
        setSelectedMeasurementId(String(data[0].id));
      } else {
        setSelectedMeasurementId('');
      }
    } catch (e) {
      console.error(e);
      alert('فشل في جلب المقاسات لهذا العميل');
    } finally {
      setLoadingMeasurements(false);
    }
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('اختر عميلًا');
      return;
    }
    if (!priceBeforeVat) {
      alert('أدخل السعر قبل الضريبة');
      return;
    }

    const customerIdNum = Number(selectedCustomerId);
    const measurementIdNum = selectedMeasurementId ? Number(selectedMeasurementId) : undefined;
    const priceNum = Number(priceBeforeVat);

    if (Number.isNaN(priceNum) || priceNum <= 0) {
      alert('السعر غير صالح');
      return;
    }

    setCreating(true);
    try {
      await createOrder({
        customerId: customerIdNum,
        measurementId: measurementIdNum,
        fabricType: fabricType || undefined,
        priceBeforeVat: priceNum,
        deliveryDate: deliveryDate || undefined,
        notes: notes || undefined,
      });

      // تصفير النموذج بسيط
      setFabricType('');
      setPriceBeforeVat('');
      setDeliveryDate('');
      setNotes('');

      await loadOrders();
      alert('تم إنشاء الطلب والفاتورة بنجاح ✅');
    } catch (e) {
      console.error(e);
      alert('فشل في إنشاء الطلب');
    } finally {
      setCreating(false);
    }
  }

  async function handleIssueEInvoice(orderId: number) {
    try {
      setIssuingForId(orderId);
      const data = await issueEInvoice(orderId);
      setEinvoiceData(data);
    } catch (e) {
      console.error(e);
      alert('فشل في إصدار الفاتورة الإلكترونية');
    } finally {
      setIssuingForId(null);
    }
  }

  return (
    <div className="card">
      <h2>الطلبات</h2>

      <div className="row">
        <span className="badge">
          {loadingOrders ? 'جارٍ تحميل الطلبات...' : `عدد الطلبات: ${orders.length}`}
        </span>
      </div>

      {/* نموذج إنشاء طلب */}
      <form onSubmit={handleCreateOrder} style={{ marginBottom: 12 }}>
        <h3>إنشاء طلب جديد</h3>

        <div className="row">
          <label>العميل:</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCustomerId(val);
              if (val) {
                loadMeasurementsForCustomer(Number(val));
              } else {
                setMeasurements([]);
                setSelectedMeasurementId('');
              }
            }}
          >
            <option value="">اختر عميلًا</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (#{c.id})
              </option>
            ))}
          </select>
          {loadingCustomers && <span className="badge">تحميل العملاء...</span>}
        </div>

        <div className="row">
          <label>المقاسات:</label>
          <select
            value={selectedMeasurementId}
            onChange={(e) => setSelectedMeasurementId(e.target.value)}
            disabled={!selectedCustomerId || loadingMeasurements}
          >
            <option value="">بدون (اختيار لاحقًا)</option>
            {measurements.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label || `مقاس #${m.id}`} – ط:{m.height ?? '-'} / ك:{m.shoulder ?? '-'} / ص:
                {m.chest ?? '-'}
              </option>
            ))}
          </select>
          {loadingMeasurements && <span className="badge">تحميل المقاسات...</span>}
        </div>

        <div className="row">
          <label>نوع القماش:</label>
          <input
            value={fabricType}
            onChange={(e) => setFabricType(e.target.value)}
            placeholder="مثلاً: ياباني صيفي"
          />
        </div>

        <div className="row">
          <label>السعر قبل الضريبة:</label>
          <input
            type="number"
            value={priceBeforeVat}
            onChange={(e) => setPriceBeforeVat(e.target.value)}
            placeholder="مثلاً: 200"
          />
        </div>

        <div className="row">
          <label>تاريخ الاستلام:</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>

        <div className="row">
          <label>ملاحظات:</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? 'جاري الحفظ...' : 'حفظ الطلب'}
        </button>
      </form>

      {/* قائمة الطلبات */}
      <h3>قائمة الطلبات</h3>
      <div className="list">
        {orders.map((o) => (
          <div key={o.id} className="list-item">
            <div>
              <div>
                طلب #{o.id}{' '}
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  ({new Date(o.createdAt).toLocaleString('ar-SA')})
                </span>
              </div>
              <div style={{ fontSize: 12 }}>
                عميل: {o.customer?.name || `#${o.customerId}`} – قماش:{' '}
                {o.fabricType || '-'}
              </div>
              <div style={{ fontSize: 12 }}>
                استلام:{' '}
                {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('ar-SA') : '-'}
                {' | '}إجمالي مع الضريبة: {o.totalAmount.toFixed(2)} ر.س
              </div>
            </div>
                <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: 'flex-end',
        }}
      >
        <span className="badge">{o.status}</span>

        {/* زر عرض → ينقلك لصفحة الطباعة */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setExternalOrderId(String(o.id));
            setActiveTab('print');
          }}
        >
          عرض
        </button>

        {/* زر الفاتورة الإلكترونية */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleIssueEInvoice(o.id)}
          disabled={issuingForId === o.id}
        >
          {issuingForId === o.id ? 'جاري الإصدار...' : 'فاتورة إلكترونية'}
        </button>
      </div>

          </div>
        ))}
        {!orders.length && <div>لا توجد طلبات بعد.</div>}
      </div>

      {/* نافذة الفاتورة الإلكترونية + QR */}
      {einvoiceData && (
        <div className="modal-backdrop" onClick={() => setEinvoiceData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>فاتورة إلكترونية</h3>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setEinvoiceData(null)}
              >
                إغلاق
              </button>
            </div>

            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <div>المحل: {einvoiceData.shop.name}</div>
              <div>الرقم الضريبي: {einvoiceData.shop.vatNumber || '-'}</div>
              <div>
                رقم الفاتورة: {einvoiceData.invoice.internalCode} – طلب #
                {einvoiceData.order.id}
              </div>
              <div>العميل: {einvoiceData.order.customerName}</div>
              <div>UUID: {einvoiceData.einvoice.uuid || '-'}</div>
              <div>الحالة: {einvoiceData.einvoice.providerStatus || 'LOCAL_ISSUED'}</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              {einvoiceData.einvoice.qrData ? (
                <QRCodeCanvas value={einvoiceData.einvoice.qrData} size={180} />
              ) : (
                <div>لا توجد بيانات QR</div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
              يمكن طباعة هذه النافذة أو حفظ صورة الرمز لاستخدامها في الفاتورة.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================
   صفحة الطباعة
   ========================= */

const PrintPage: React.FC<{ externalOrderId?: string }> = ({ externalOrderId }) => {
  const [orderId, setOrderId] = useState(externalOrderId || '1');
  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPrint() {
    if (!orderId) return;
    setLoading(true);
    try {
      const d = await getPrintData(Number(orderId));
      setData(d);
    } catch (e) {
      console.error(e);
      alert('فشل في جلب بيانات الطباعة');
    } finally {
      setLoading(false);
    }
  }

  // لو جينا من صفحة الطلبات بزر "عرض"
  useEffect(() => {
    if (externalOrderId) {
      setOrderId(externalOrderId);
      // نحمّل مباشرة بيانات هذا الطلب
      (async () => {
        setLoading(true);
        try {
          const d = await getPrintData(Number(externalOrderId));
          setData(d);
        } catch (e) {
          console.error(e);
          alert('فشل في جلب بيانات الطباعة');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [externalOrderId]);


  function printSection(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8" />
          <title>طباعة</title>
          <style>
            body {
              font-family: system-ui, -apple-system, "Noto Kufi Arabic", "Cairo", Tahoma, sans-serif;
              margin: 0;
              padding: 16px;
            }
            .invoice-box {
              max-width: 800px;
              margin: 0 auto;
              padding: 16px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 6px 8px;
              font-size: 13px;
            }
            th {
              background: #f3f4f6;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            ${el.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <div className="card">
      <h2>الطباعة</h2>

      <div className="row">
        <label>رقم الطلب:</label>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          style={{ maxWidth: 80 }}
        />
        <button
  className="btn btn-primary"
  onClick={() => loadPrint()}
>
  عرض
</button>
        {loading && <span className="badge">جارٍ التحميل...</span>}
      </div>

      {!data && !loading && <p>أدخل رقم الطلب واضغط "عرض" لتهيئة الفاتورة وقصاصة الخياط.</p>}

      {data && (
        <div className="print-grid">
          {/* فاتورة العميل */}
          <div className="print-card">
            <div className="print-card-header">
              <h3>فاتورة العميل</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => printSection('customerInvoicePrint')}
              >
                طباعة الفاتورة
              </button>
            </div>
            <div id="customerInvoicePrint" className="print-body">
              <h3 style={{ margin: 0 }}>{data.customerInvoice.shop.name}</h3>
              <div style={{ fontSize: 12, marginBottom: 8 }}>
                <div>س.ت: {data.customerInvoice.shop.crNumber}</div>
                <div>الرقم الضريبي: {data.customerInvoice.shop.vatNumber}</div>
                <div>العنوان: {data.customerInvoice.shop.address}</div>
                <div>جوال: {data.customerInvoice.shop.phone}</div>
              </div>
              <hr />
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <div>رقم الفاتورة: {data.customerInvoice.invoice.internalCode}</div>
                <div>
                  تاريخ الفاتورة:{' '}
                  {new Date(data.customerInvoice.invoice.issueDate).toLocaleString('ar-SA')}
                </div>
                <div>اسم العميل: {data.customerInvoice.customer.name}</div>
                <div>جوال العميل: {data.customerInvoice.customer.phone || '-'}</div>
                <div>رقم الطلب: {data.customerInvoice.order.id}</div>
                <div>
                  تاريخ الاستلام:{' '}
                  {data.customerInvoice.order.deliveryDate
                    ? new Date(
                        data.customerInvoice.order.deliveryDate,
                      ).toLocaleDateString('ar-SA')
                    : '-'}
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>الوصف</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>الضريبة 15%</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customerInvoice.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'center' }}>{item.unitPrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{item.vatAmount.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'left', marginTop: 8, fontSize: 13 }}>
                <div>
                  المجموع قبل الضريبة:{' '}
                  {data.customerInvoice.totals.subtotal.toFixed(2)} ر.س
                </div>
                <div>
                  إجمالي الضريبة:{' '}
                  {data.customerInvoice.totals.vatAmount.toFixed(2)} ر.س
                </div>
                <div>
                  <strong>
                    الإجمالي مع الضريبة:{' '}
                    {data.customerInvoice.totals.totalAmount.toFixed(2)} ر.س
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* قصاصة الخياط */}
          <div className="print-card">
            <div className="print-card-header">
              <h3>قصاصة الخياط</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => printSection('tailorSlipPrint')}
              >
                طباعة القصاصة
              </button>
            </div>
            <div id="tailorSlipPrint" className="print-body">
              <h3 style={{ margin: 0 }}>{data.tailorSlip.shopName}</h3>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <div>رقم الطلب: {data.tailorSlip.orderId}</div>
                <div>رقم الفاتورة: {data.tailorSlip.invoiceCode}</div>
                <div>العميل: {data.tailorSlip.customerName}</div>
                <div>القماش: {data.tailorSlip.fabricType || '-'}</div>
                <div>
                  تاريخ الاستلام:{' '}
                  {data.tailorSlip.deliveryDate
                    ? new Date(data.tailorSlip.deliveryDate).toLocaleDateString('ar-SA')
                    : '-'}
                </div>
              </div>
              <table>
                <tbody>
                  <tr>
                    <th>النوع</th>
                    <th>القياس</th>
                  </tr>
                  <tr>
                    <td>الطول</td>
                    <td>{data.tailorSlip.measurements?.height ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>الكتف</td>
                    <td>{data.tailorSlip.measurements?.shoulder ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>الصدر</td>
                    <td>{data.tailorSlip.measurements?.chest ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>الوسط</td>
                    <td>{data.tailorSlip.measurements?.waist ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>الكم</td>
                    <td>{data.tailorSlip.measurements?.sleeve ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>المعصم</td>
                    <td>{data.tailorSlip.measurements?.wrist ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>الرقبة</td>
                    <td>{data.tailorSlip.measurements?.neck ?? '-'}</td>
                  </tr>
                  <tr>
                    <td>الورك</td>
                    <td>{data.tailorSlip.measurements?.hip ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <strong>ملاحظات:</strong>
                <div>
                  {data.tailorSlip.notes ||
                    data.tailorSlip.measurements?.notes ||
                    '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
