# Changelog — CashierMu API (Backend)

Semua perubahan signifikan pada project ini didokumentasikan di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Session: 2026-10-05

### Fixed

#### transactions.controller.ts — Invoice Number Unique Constraint Error (P2002)
- **File:** `src/modules/transactions/transactions.controller.ts`
- Tambah import `{ Prisma }` dari `@prisma/client`.
- Ganti single `prisma.$transaction()` call dengan **retry loop** (max 3 attempts) yang menangkap `PrismaClientKnownRequestError` dengan `code === 'P2002'`:
  - Jika P2002 (unique constraint pada `invoiceNumber`) → generate invoice number baru dan retry.
  - Jika error lain → re-throw immediately, tidak di-retry.
  - Setelah 3 kali gagal → throw error terakhir ke `next(err)` → `errorHandler` return 409.
- **Root cause:** `generateInvoiceNumber` menggunakan `COUNT + 1` yang tidak atomic. Dua request yang tiba hampir bersamaan (double-tap user) membaca `count` yang sama → generate `invoiceNumber` yang sama → request kedua kena P2002.

#### utils/invoice.ts — Invoice Number Collision Lintas Branch / Store
- **File:** `src/utils/invoice.ts`
- Ubah signature: `generateInvoiceNumber(branchId)` → `generateInvoiceNumber(storeId)`.
- Ganti strategi dari **COUNT-based** ke **MAX-based**:
  ```
  SEBELUM: count(branchId, today) + 1
  SESUDAH: parse sequence dari invoiceNumber terakhir hari ini (storeId, startsWith prefix) + 1
  ```
- Filter menggunakan `invoiceNumber: { startsWith: prefix }` (bukan `createdAt` date range) untuk menghindari timezone mismatch antara server UTC dan local time.
- **Root cause 1 (lintas branch):** `invoiceNumber @unique` secara global di schema Prisma, tapi count di-filter per `branchId`. Dua branch berbeda yang sama-sama membuat transaksi pertama hari ini akan generate `INV-YYYYMMDD-0001` → collision.
- **Root cause 2 (retry tidak efektif):** COUNT-based approach selalu menghasilkan invoice number yang sama pada setiap retry karena failed inserts di-rollback → count tidak berubah → nilai yang di-generate identik di setiap attempt → semua 3 retry gagal.
- **Solusi:** MAX-based selalu membaca `invoiceNumber` tertinggi yang sudah committed → nilai yang di-generate selalu beda dari record yang sudah ada → retry efektif untuk concurrent race condition.

---

## [1.0.0] — Prior to 2026-10-05

### Added
- REST API dengan Express.js + TypeScript + Prisma ORM (PostgreSQL).
- Modul: `auth`, `branches`, `categories`, `pending-bills`, `products`, `reports`, `shifts`, `store`, `transactions`, `users`.
- JWT authentication middleware (`authenticate.ts`).
- Role-based access control (`requireRole.ts`).
- Zod schema validation (`validate.ts`).
- Global error handler (`errorHandler.ts`) dengan handling Prisma error codes P2002, P2025.
- Invoice number generator (`utils/invoice.ts`).
- Multi-tenant: semua resource di-scope per `storeId` dari JWT payload.
- Shift management: validasi shift aktif sebelum transaksi, update totals saat transaksi/void.
- Transaction void: verifikasi PIN owner (bcrypt), restore stock, reverse shift totals.
