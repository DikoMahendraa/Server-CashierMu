# CashierMu — Development Notes & Issue Log

Dokumentasi pembelajaran: kumpulan issue yang ditemukan, root cause, dan cara mengatasinya.
Berguna sebagai referensi untuk proyek masa depan.

---

## 1. Expo Dev Client Setup di Xcode 26 / Swift 6.2

### Problem
`npx expo run:ios` gagal compile karena Xcode 26 menggunakan Swift 6.2 yang menerapkan dua aturan baru yang lebih strict:
1. **SE-0430 Region-based Sending:** `nonisolated(unsafe) let` dalam closure tidak boleh meng-capture pointer yang di-kirim lintas concurrency boundary.
2. **`SWIFT_RETURNS_RETAINED` ditolak pada `SWIFT_SHARED_REFERENCE` types.**

Error muncul di `expo-modules-jsi@57.1.1` yang belum update untuk Swift 6.2.

### Root Cause
Library `expo-modules-jsi` meng-enable upcoming Swift features yang secara agresif menerapkan Swift 6 concurrency rules:
- `NonisolatedNonsendingByDefault`
- `InferIsolatedConformances`

Di Swift 6.2, kedua feature ini berinteraksi dengan `RuntimeScheduler.h` dan `JavaScriptRuntime.swift` menghasilkan compile error.

### Solution
Patch `node_modules` via `patch-package`:
1. `RuntimeScheduler.h`: Hapus `SWIFT_RETURNS_RETAINED` dari kedua constructor.
2. `Package.swift`: Hapus dua `enableUpcomingFeature` calls.
3. `JavaScriptRuntime.swift` (3 site): Ganti `nonisolated(unsafe) let x = x` pattern dengan wrapper `NonisolatedUnsafeVar<T>`.
4. `ios/Podfile`: Tambah `post_install` hook `SWIFT_STRICT_CONCURRENCY = 'minimal'`.

### Lesson Learned
- Saat update Xcode major version (esp. yang bawa Swift version baru), periksa apakah library native sudah support.
- `patch-package` + `postinstall` hook adalah solusi pragmatis untuk patch node_modules yang bertahan saat `npm install`.
- Jangan upgrade Xcode major version mendekati deadline produksi tanpa testing dulu.

---

## 2. Metro Crash: Cannot find module 'react-native-reanimated/plugin'

### Problem
Setelah `react-native-reanimated` dihapus dari project (karena menyebabkan crash pada app), Metro bundler gagal start dengan error:
```
Cannot find module 'react-native-reanimated/plugin'
```

### Root Cause
`nativewind` menggunakan `react-native-css-interop` sebagai Babel transformer. Di dalam `babel.js`-nya, ada hardcoded:
```js
plugins: [
  require("./dist/babel-plugin").default,
  ["react-native-reanimated/plugin"],  // ← ini
  ...
]
```
Ini di-load saat Metro inisialisasi Babel transform, bukan saat ada file yang import reanimated. Jadi walau tidak ada code yang pakai reanimated, Metro tetap crash.

### Solution
Patch `react-native-css-interop/babel.js` via `patch-package` untuk hapus line `"react-native-reanimated/plugin"`.

Setelah patch:
```
npx expo start --clear   # wajib --clear untuk reset Babel cache
```

### Lesson Learned
- `nativewind@4` membutuhkan `react-native-reanimated`. Kalau tidak mau pakai reanimated, downgrade ke `nativewind@2` yang tidak punya dependency ini, atau cari alternative animation library yang tidak disyaratkan oleh CSS interop.
- Selalu jalankan `--clear` setelah mengubah Babel config/plugin — Metro cache babel transform secara agresif.
- `npx expo start` ≠ `npx expo run:ios`:
  - `expo start` = jalankan Metro bundler saja (untuk JS-only changes, pakai dev client yang sudah terinstall)
  - `expo run:ios` = compile native + install ke device + jalankan Metro

---

## 3. Tombol "Cetak Ulang" Tidak Berfungsi

### Problem
Button "Cetak Ulang" di `TransactionDetailScreen` tidak melakukan apapun saat ditekan.

### Root Cause
Button tidak punya `onPress` handler. Ada `TouchableOpacity` tapi tidak ada fungsi yang terpasang.

### Solution
Implementasi `handleReprint`:
1. Cek `printerService.isConnected()` — tampilkan `Alert` informatif jika belum terhubung.
2. Set `loading` state untuk disable button dan tampilkan spinner.
3. Panggil `printerService.print(transaction, storeProfile...)`.
4. Tangkap error dan tampilkan `Alert`.

### Lesson Learned
- Selalu pass semua context yang dibutuhkan printer service: `storeName`, `storeAddress`, `storePhone`, `receiptHeader`, `receiptFooter`.
- Perubahan ini JS-only → tidak perlu build ulang native, cukup reload Metro.

---

## 4. Status Printer di SettingsScreen Tidak Update

### Problem
Setelah berhasil connect printer dari `PrinterSettingsScreen`, halaman `SettingsScreen` masih menampilkan status "Tidak Terhubung".

### Root Cause
`SettingsScreen` membaca `hardwareSettings.printer?.status` dari **Zustand store**. Tapi `PrinterSettingsScreen.handleConnect()` hanya memanggil `printerService.connect()` yang menyimpan address ke `AsyncStorage` dan membangun koneksi BLE — tidak pernah update Zustand store.

Dua source of truth yang tidak sync:
- `printerService` (koneksi BLE aktual, singleton)
- Zustand `hardwareSettings.printer` (state UI)

### Solution
Di `PrinterSettingsScreen`:
- Setelah `connect` sukses → `updateHardwareSettings({ printer: { address, name, paperWidth, status: 'connected', lastConnectedAt } })`
- Setelah `disconnect` sukses → `updateHardwareSettings({ printer: null })`

### Lesson Learned
- Service/singleton yang mengelola hardware (BLE, scanner, dll.) perlu di-bridge ke state management (Zustand) secara eksplisit — mereka tidak sync otomatis.
- Pola yang baik: setelah aksi hardware berhasil, selalu update UI state store.

---

## 5. Struk Kosong — Blank Receipt (Printer Termal BLE)

### Problem
Setelah print diperintahkan, printer menerima data dan kertas maju (paper feed berjalan), tapi tidak ada teks yang tercetak sama sekali.

### Root Cause
`printer.service.ts` memanggil `.codepage(CODEPAGE.CP850)` (kemudian diubah ke `CP437`) yang mengirim byte sequence `[0x1B, 0x74, 0x00]` ke printer.

Printer termal murum 58mm yang banyak beredar di pasaran memiliki implementasi ESC/POS yang tidak lengkap. Ketika menerima `ESC t 0x00`:
- Byte `0x00` (null) setelah `0x74` diinterpretasikan sebagai null/end-of-stream atau parameter dari command vendor-specific yang tidak dikenal.
- Printer masuk ke **undefined parsing state** dan memindai semua byte berikutnya sebagai parameter dari command yang sedang di-parse.
- Semua perintah teks (`line()`, `bold()`, `align()`) diabaikan.
- `feedToTear` (`ESC d 18`) masih dieksekusi karena beberapa printer handle feed command secara independen di firmware → kertas maju tapi tidak ada teks.

Investigasi library source (`escpos.ts`) juga menemukan bahwa `EscPosBuilder.text()` meng-encode dengan `encodeCodepage850` sebagai default — tidak konsisten dengan `codepage(CP437)` yang di-set. Namun ini tidak relevan untuk teks Indonesia karena semua karakternya adalah ASCII (byte value 0-127 identik di CP437 dan CP850).

### Solution
Hapus `.codepage()` call sepenuhnya:
```ts
// SEBELUM
const b = new EscPosBuilder().init().codepage(CODEPAGE.CP437);

// SESUDAH
const b = new EscPosBuilder().init();
```

### Lesson Learned
- **"Paper feeds but no text" = printer confused by a command.** Ini adalah signature dari codepage command yang tidak didukung. Isolasi dengan menghapus command satu per satu.
- Printer termal murah Cina (non-branded, OEM 58mm) sering punya subset ESC/POS yang sangat terbatas. Jangan assume semua command standard didukung.
- Untuk teks yang semuanya ASCII (Indonesia, Inggris, angka, simbol dasar), tidak perlu set codepage sama sekali — printer factory default sudah cukup.
- `ESC t 0x00` adalah byte sequence yang berbahaya pada banyak printer. Prefer tidak mengirimnya kecuali diketahui printer support codepage selection.
- Selalu debug dengan **minimum viable receipt** (hanya satu line teks + feed) sebelum menambah formatting kompleks.

---

## 6. Pembayaran Gagal: "A record with this value already exists"

### Problem
Setiap kali konfirmasi pembayaran ditekan, transaksi gagal dengan error message:
```
Pembayaran Gagal — A record with this value already exists
```
Backend log menunjukkan: `Unique constraint failed on the fields: (invoiceNumber)`, Prisma error code `P2002`.

### Root Cause

**FE — Double Submit:**
Button konfirmasi pembayaran menggunakan `disabled={!canPay}` di mana `canPay = isCashOk` (hanya cek kecukupan uang). State `loading` tidak dimasukkan ke kondisi disable. User yang mengetuk tombol dua kali cepat bisa mengirim dua request sebelum React re-render dengan `loading: true`.

**BE — Invoice Number tidak Atomic (COUNT-based race condition):**
```ts
// utils/invoice.ts — BERMASALAH
const count = await prisma.transaction.count({ where: { branchId, createdAt: ... } });
const seq = String(count + 1).padStart(4, '0');
return `INV-${dateStr}-${seq}`;
```
`COUNT` → `+1` → `INSERT` adalah tiga operasi terpisah yang tidak atomic. Dua request bersamaan membaca `count` yang sama → generate `invoiceNumber` yang sama → yang kedua kena P2002.

**BE — Collision Lintas Branch (Systematic, bukan hanya concurrent):**
`invoiceNumber @unique` secara **global** di schema Prisma. Tapi count di-filter per `branchId`. Jika Branch A dan Branch B masing-masing membuat transaksi pertama hari ini, keduanya generate `INV-20261004-0001` → collision pasti terjadi (bukan hanya kalau concurrent).

**BE — Retry tidak efektif karena COUNT tidak berubah:**
Solusi awal menambah retry loop (max 3x) yang catch P2002 dan generate ulang. Namun karena `generateInvoiceNumber` pakai COUNT, dan failed INSERT di-rollback (tidak mengubah count), setiap retry menghasilkan **invoice number yang identik** → semua 3 attempts gagal → tetap return 409.

### Solution

**FE:** Tambah `|| loading` ke disabled prop:
```tsx
// SEBELUM
disabled={!canPay}

// SESUDAH
disabled={!canPay || loading}
```

**BE — Ganti COUNT dengan MAX:**
```ts
// utils/invoice.ts — FIXED
const last = await prisma.transaction.findFirst({
  where: {
    storeId,              // ← scope ke store, bukan branch
    invoiceNumber: { startsWith: prefix },  // ← filter by prefix, bukan createdAt
  },
  orderBy: { invoiceNumber: 'desc' },
  select: { invoiceNumber: true },
});

let seq = 1;
if (last) {
  const lastSeq = parseInt(last.invoiceNumber.slice(prefix.length), 10);
  if (!isNaN(lastSeq)) seq = lastSeq + 1;
}
```

Kenapa MAX-based lebih robust dari COUNT-based:
- MAX membaca record yang **sudah committed** → tidak terpengaruh oleh rollback
- Filter per `storeId` → tidak ada collision lintas branch dalam satu store
- Filter `startsWith prefix` (bukan `createdAt`) → immune terhadap timezone mismatch (server UTC vs local)
- Retry loop tetap dipertahankan untuk menangani concurrent requests yang lolos (sangat jarang tapi tetap mungkin)

### Lesson Learned
- **Jangan gunakan COUNT + 1 untuk generate unique sequential ID** — ini adalah anti-pattern klasik yang race-prone. Gunakan MAX dari nilai yang sudah ada, database sequence (`SERIAL`, `NEXTVAL`), atau UUID.
- **Unique constraint harus konsisten dengan scope generate:** Kalau `invoiceNumber @unique` global, maka generate-nya harus juga global (scope ke storeId minimal), bukan per sub-entity (branchId).
- **Retry yang di-generate ulang dengan input sama = retry yang sia-sia.** Pastikan retry benar-benar menghasilkan nilai berbeda, bukan nilai yang sama.
- Selalu disable tombol submit saat `loading` aktif — pattern: `disabled={!canSubmit || isLoading}`.
- Filter database query menggunakan field yang menyimpan nilai (invoice number prefix) lebih robust daripada filter timestamp yang bisa kena timezone issue.

---

## Ringkasan Pola & Best Practices

| Area | Anti-Pattern | Best Practice |
|------|-------------|---------------|
| Sequential ID | `COUNT + 1` | `MAX dari nilai terakhir + 1` atau DB sequence |
| Unique scope | Unique global, generate per subset | Scope generate = scope unique constraint |
| Retry | Retry dengan input yang sama | Pastikan retry menghasilkan nilai berbeda |
| UI Submit | `disabled={!canSubmit}` | `disabled={!canSubmit \|\| isLoading}` |
| Hardware ↔ UI State | Langsung baca dari service | Sync ke state management (Zustand) setelah aksi berhasil |
| ESC/POS Debugging | Kirim full formatting langsung | Test dengan minimal receipt dulu, tambah command satu per satu |
| node_modules patch | Edit langsung (hilang saat reinstall) | `patch-package` + `postinstall` hook |
| Metro cache | Restart biasa | `npx expo start --clear` setelah ubah Babel config |
