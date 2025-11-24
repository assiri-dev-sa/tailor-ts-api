-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "measurementId" INTEGER,
    "fabricType" TEXT,
    "priceBeforeVat" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "deliveryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "internalCode" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "uuid" TEXT,
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "qrData" TEXT,
    "providerStatus" TEXT,
    "providerRawResp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_internalCode_key" ON "Invoice"("internalCode");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoice_invoiceId_key" ON "EInvoice"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoice_uuid_key" ON "EInvoice"("uuid");
