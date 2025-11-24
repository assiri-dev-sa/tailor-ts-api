-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Saudi Arabia',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "internalCode" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "invoiceType" TEXT NOT NULL DEFAULT 'SIMPLIFIED',
    "vatCategory" TEXT NOT NULL DEFAULT 'STANDARD_15',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("id", "internalCode", "issueDate", "orderId", "subtotal", "totalAmount", "vatAmount") SELECT "id", "internalCode", "issueDate", "orderId", "subtotal", "totalAmount", "vatAmount" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");
CREATE UNIQUE INDEX "Invoice_internalCode_key" ON "Invoice"("internalCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
