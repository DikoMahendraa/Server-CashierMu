-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'cashier');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('pagi', 'siang', 'malam');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('paid', 'voided', 'pending');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'qris', 'transfer', 'debit_card', 'credit_card');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "receiptHeader" TEXT NOT NULL DEFAULT '',
    "receiptFooter" TEXT NOT NULL DEFAULT '',
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "serviceChargeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "serviceChargeRate" DECIMAL(5,4) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "currencySymbol" TEXT NOT NULL DEFAULT 'Rp',
    "shiftEnabled" BOOLEAN NOT NULL DEFAULT true,
    "shiftRequireOpeningBalance" BOOLEAN NOT NULL DEFAULT true,
    "shiftBranchSelection" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "role" "UserRole" NOT NULL DEFAULT 'cashier',
    "pinHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'package',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "categoryId" TEXT NOT NULL,
    "buyPrice" DECIMAL(15,2) NOT NULL,
    "sellPrice" DECIMAL(15,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantGroup" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "multiSelect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VariantGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantOption" (
    "id" TEXT NOT NULL,
    "variantGroupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceModifier" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "ShiftType" NOT NULL,
    "openingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(15,2),
    "cashSalesTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "digitalSalesTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "variance" DECIMAL(15,2),
    "status" "ShiftStatus" NOT NULL DEFAULT 'open',
    "notes" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discountType" TEXT,
    "discountValue" DECIMAL(15,2),
    "discountLabel" TEXT,
    "discountCode" TEXT,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "serviceChargeRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "serviceChargeAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(15,2) NOT NULL,
    "cashPaid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "changeAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "customerName" TEXT NOT NULL DEFAULT '',
    "status" "TransactionStatus" NOT NULL DEFAULT 'paid',
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "selectedVariants" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,

    CONSTRAINT "PaymentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingBill" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "discountType" TEXT,
    "discountValue" DECIMAL(15,2),
    "discountLabel" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_invoiceNumber_key" ON "Transaction"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantGroup" ADD CONSTRAINT "VariantGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantOption" ADD CONSTRAINT "VariantOption_variantGroupId_fkey" FOREIGN KEY ("variantGroupId") REFERENCES "VariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "PaymentEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
