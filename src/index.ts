import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { prisma } from './db/client';

// إعدادات افتراضية للمحل (تستخدم لو ما وجدنا Settings في القاعدة)
const DEFAULT_SHOP_CONFIG = {
  name: 'محل خياطة تجريبي',
  crNumber: '1234567890',
  vatNumber: '300000000000003',
  address: 'أبها - المملكة العربية السعودية',
  phone: '0500000000',
  city: 'أبها',
  country: 'Saudi Arabia',
};

// توليد UUID
function generateUUID() {
  // إذا randomUUID متوفرة نستخدمها
  if ((crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  // بديل بسيط
  return crypto.randomBytes(16).toString('hex');
}

// توليد TLV + Base64 لرمز QR (نموذج مبسّط ZATCA)
function buildZatcaQRBase64(params: {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO string
  totalAmount: number;
  vatAmount: number;
}) {
  function toTLV(tag: number, value: string): Buffer {
    const valueBuffer = Buffer.from(value, 'utf8');
    const tlv = Buffer.alloc(2 + valueBuffer.length);
    tlv[0] = tag;
    tlv[1] = valueBuffer.length;
    valueBuffer.copy(tlv, 2);
    return tlv;
  }

  const { sellerName, vatNumber, timestamp, totalAmount, vatAmount } = params;

  const buffers = Buffer.concat([
    toTLV(1, sellerName || ''),
    toTLV(2, vatNumber || ''),
    toTLV(3, timestamp || ''),
    toTLV(4, totalAmount.toFixed(2)),
    toTLV(5, vatAmount.toFixed(2)),
  ]);

  return buffers.toString('base64');
}

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// =========================
//      Health Check
// =========================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// =========================
//      Shop Settings
// =========================

// جلب إعدادات المحل
app.get('/settings', async (_req, res) => {
  try {
    const settings = await prisma.shopSettings.findFirst();

    if (!settings) {
      // لو ما فيه إعدادات نخلي الافتراضي
      return res.json(DEFAULT_SHOP_CONFIG);
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

// حفظ / تحديث إعدادات المحل
app.put('/settings', async (req, res) => {
  try {
    const { name, crNumber, vatNumber, address, phone, city, country } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'الاسم (اسم المنشأة) مطلوب' });
    }

    const updated = await prisma.shopSettings.upsert({
      where: { id: 1 },
      update: { name, crNumber, vatNumber, address, phone, city, country },
      create: {
        id: 1,
        name,
        crNumber,
        vatNumber,
        address,
        phone,
        city,
        country,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'فشل في حفظ الإعدادات' });
  }
});

// =========================
//      Customers
// =========================

// إنشاء عميل جديد
app.post('/customers', async (req, res) => {
  try {
    const { name, phone, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });

    const customer = await prisma.customer.create({
      data: { name, phone, notes },
    });

    res.status(201).json(customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// جلب العملاء
app.get('/customers', async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//     Measurements
// =========================

// إضافة مقاسات لعميل
app.post('/customers/:customerId/measurements', async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);

    const {
      label,
      height,
      shoulder,
      chest,
      waist,
      sleeve,
      wrist,
      neck,
      hip,
      notes,
    } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const measurement = await prisma.measurement.create({
      data: {
        customerId,
        label,
        height,
        shoulder,
        chest,
        waist,
        sleeve,
        wrist,
        neck,
        hip,
        notes,
      },
    });

    res.status(201).json(measurement);
  } catch (error: any) {
    console.error('Error creating measurement:', error);
    res.status(500).json({ error: error.message });
  }
});

// جلب مقاسات عميل
app.get('/customers/:customerId/measurements', async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { measurements: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    res.json(customer.measurements);
  } catch (error: any) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//        Orders
// =========================

// إنشاء طلب + إنشاء فاتورة داخلية تلقائيًا
app.post('/orders', async (req, res) => {
  try {
    const {
      customerId,
      measurementId,
      fabricType,
      priceBeforeVat,
      deliveryDate,
      notes,
    } = req.body;

    const cId = Number(customerId);

    if (!cId) return res.status(400).json({ error: 'customerId غير صالح' });
    if (priceBeforeVat === undefined)
      return res.status(400).json({ error: 'priceBeforeVat مطلوب' });

    const customer = await prisma.customer.findUnique({ where: { id: cId } });
    if (!customer) return res.status(404).json({ error: 'العميل غير موجود' });

    let mId = measurementId ? Number(measurementId) : null;
    if (mId) {
      const check = await prisma.measurement.findUnique({ where: { id: mId } });
      if (!check) return res.status(404).json({ error: 'المقاسات غير موجودة' });
    }

    const price = Number(priceBeforeVat);
    const vat = +(price * 0.15).toFixed(2);
    const total = price + vat;

    const order = await prisma.order.create({
      data: {
        customerId: cId,
        measurementId: mId ?? undefined,
        fabricType,
        priceBeforeVat: price,
        vatAmount: vat,
        totalAmount: total,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        notes,
      },
    });

    const invoiceCode = `INV-${order.id.toString().padStart(6, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        internalCode: invoiceCode,
        subtotal: price,
        vatAmount: vat,
        totalAmount: total,
        // الحقول الجديدة لها default في Prisma (invoiceType / vatCategory / currency)
      },
    });

    res.status(201).json({ order, invoice });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// جلب جميع الطلبات
app.get('/orders', async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { customer: true, measurement: true, invoice: true },
      orderBy: { id: 'desc' },
    });

    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// جلب طلب واحد بالتفصيل
app.get('/orders/:orderId', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, measurement: true, invoice: true },
    });

    if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

    res.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
//        PRINT DATA
// =========================

app.get('/orders/:orderId/print', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, measurement: true, invoice: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    if (!order.invoice) {
      return res.status(400).json({ error: 'لا توجد فاتورة مرتبطة بهذا الطلب' });
    }

    if (!order.customer) {
      return res.status(400).json({ error: 'لا يوجد عميل مرتبط بهذا الطلب' });
    }

    const inv = order.invoice;
    const cust = order.customer;
    const meas = order.measurement;

    // جلب إعدادات المحل من القاعدة أو الافتراضيات
    const settings = await prisma.shopSettings.findFirst();
    const shop = settings || DEFAULT_SHOP_CONFIG;

    const customerInvoice = {
      shop: {
        name: shop.name,
        crNumber: shop.crNumber || undefined,
        vatNumber: shop.vatNumber || undefined,
        address: shop.address || undefined,
        phone: shop.phone || undefined,
      },
      invoice: {
        internalCode: inv.internalCode,
        issueDate: inv.issueDate,
      },
      customer: {
        name: cust.name,
        phone: cust.phone,
      },
      order: {
        id: order.id,
        deliveryDate: order.deliveryDate,
      },
      items: [
        {
          description: order.fabricType || 'تفصيل ثوب رجالي',
          quantity: 1,
          unitPrice: inv.subtotal,
          vatAmount: inv.vatAmount,
          total: inv.totalAmount,
        },
      ],
      totals: {
        subtotal: inv.subtotal,
        vatAmount: inv.vatAmount,
        totalAmount: inv.totalAmount,
      },
    };

    const tailorSlip = {
      shopName: shop.name,
      orderId: order.id,
      invoiceCode: inv.internalCode,
      customerName: cust.name,
      fabricType: order.fabricType,
      deliveryDate: order.deliveryDate,
      notes: order.notes,
      measurements: meas || null,
    };

    res.json({ customerInvoice, tailorSlip });
  } catch (error: any) {
    console.error('Print error:', error);
    res.status(500).json({ error: 'فشل في تجهيز بيانات الطباعة' });
  }
});

// =========================
//   إصدار فاتورة إلكترونية
// =========================

app.post('/orders/:orderId/einvoice', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, invoice: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    if (!order.invoice) {
      return res.status(400).json({ error: 'لا توجد فاتورة مرتبطة بهذا الطلب' });
    }

    const inv = order.invoice;
    const cust = order.customer;

    if (!cust) {
      return res.status(400).json({ error: 'لا يوجد عميل مرتبط بهذا الطلب' });
    }

    // تحقق هل سبق إصدار eInvoice
    const existing = await prisma.eInvoice.findUnique({
      where: { invoiceId: inv.id },
    });

    const settings = await prisma.shopSettings.findFirst();
    const shop = settings || DEFAULT_SHOP_CONFIG;

    const sellerName = shop.name || 'متجر';
    const vatNumber = shop.vatNumber || '';
    const timestamp = inv.issueDate.toISOString();
    const totalAmount = inv.totalAmount;
    const vatAmount = inv.vatAmount;

    const qrBase64 = buildZatcaQRBase64({
      sellerName,
      vatNumber,
      timestamp,
      totalAmount,
      vatAmount,
    });

    const uuid = existing?.uuid || generateUUID();

    const einvoice = await prisma.eInvoice.upsert({
      where: { invoiceId: inv.id },
      update: {
        uuid,
        qrData: qrBase64,
        providerStatus: 'LOCAL_ISSUED',
        providerRawResp: null,
      },
      create: {
        invoiceId: inv.id,
        uuid,
        qrData: qrBase64,
        providerStatus: 'LOCAL_ISSUED',
      },
    });

    res.json({
      invoice: inv,
      order: {
        id: order.id,
        customerName: cust.name,
      },
      shop: {
        name: shop.name,
        vatNumber: shop.vatNumber,
      },
      einvoice,
    });
  } catch (error: any) {
    console.error('EInvoice issue error:', error);
    res.status(500).json({ error: 'فشل في إصدار الفاتورة الإلكترونية' });
  }
});

// =========================
//     START SERVER
// =========================

app.listen(port, () => {
  console.log(`Tailor API running on http://localhost:${port}`);
});
