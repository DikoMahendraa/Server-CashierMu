# Deployment & Versioning Guide — CashierMu

Panduan standar branching, versioning, dan release workflow untuk project CashierMu.
Berlaku untuk FE (`cashiermu`) dan BE (`server-cashiermu`).

---

## Daftar Isi

1. [Branching Strategy](#1-branching-strategy)
2. [Naming Convention](#2-naming-convention)
3. [Merge Strategy](#3-merge-strategy)
4. [Semantic Versioning](#4-semantic-versioning)
5. [CHANGELOG Convention](#5-changelog-convention)
6. [Workflow Harian](#6-workflow-harian-featurefix)
7. [Workflow Release](#7-workflow-release)
8. [Hotfix Production](#8-hotfix-production)
9. [Cheat Sheet](#9-cheat-sheet)

---

## 1. Branching Strategy

Project ini menggunakan **Gitflow**. Dua branch utama yang selalu ada:

```
main        ← production-ready. Selalu stable, tidak pernah commit langsung.
develop     ← integration branch. Semua fitur & fix masuk sini dulu sebelum release.
```

Branch pendukung (dibuat saat dibutuhkan, dihapus setelah merge):

```
feature/xxx     ← fitur baru
fix/xxx         ← bug fix
chore/xxx       ← perubahan non-fungsional (docs, config, deps, refactor)
release/vX.Y.Z  ← persiapan release: bump version + finalize changelog
hotfix/xxx      ← urgent fix langsung dari main (production incident)
```

**Diagram alur:**

```
main ─────────────────────────────────── M2 ──────────────── M3
                                        ↑                    ↑
release/v1.1.0 ──────────────── bump ───┘
                                                    hotfix/crash ──┘
develop ── A ── B ─────────── C ── D ───────────────────────── E
                ↑             ↑    ↑
           feature/x      fix/y  chore/z
```

---

## 2. Naming Convention

Format: **`<type>/<short-kebab-description>`**

### Rules
- Lowercase semua
- Gunakan tanda `-` (kebab-case), bukan underscore atau spasi
- Singkat tapi deskriptif, 3–5 kata
- Tidak ada nama orang, tanggal, atau nomor tiket di nama branch (itu urusan commit message / PR title)

### Contoh per Tipe

| Tipe | Contoh Branch |
|------|--------------|
| `feature/` | `feature/printer-ble-integration` |
| `feature/` | `feature/reprint-button` |
| `feature/` | `feature/shift-management` |
| `fix/` | `fix/blank-receipt-codepage` |
| `fix/` | `fix/invoice-duplicate-p2002` |
| `fix/` | `fix/payment-double-submit` |
| `fix/` | `fix/printer-status-sync` |
| `chore/` | `chore/setup-expo-dev-client` |
| `chore/` | `chore/patch-expo-modules-jsi` |
| `chore/` | `chore/update-dependencies` |
| `release/` | `release/v1.1.0` |
| `hotfix/` | `hotfix/critical-payment-crash` |

---

## 3. Merge Strategy

Gunakan merge strategy yang berbeda tergantung arah merge:

### Feature / Fix / Chore → `develop` : **Squash Merge**

```
develop:      A ─── B ─── [S]
                           ↑
branch:   x ── y ── wip ── z
```

Branch kerja sehari-hari biasanya berisi commit `wip`, `fix typo`, `coba ini`, `revert` dll. Squash mengubah semua itu menjadi **satu commit bersih** di `develop`.

Di GitHub: pilih **"Squash and merge"**

### `release/*` → `main` : **Merge Commit**

```
main:     A ──────────────── [M]
                             /
release:  ── bump ── final ─
```

Jangan squash release ke main. Merge commit penting untuk:
- Melacak titik persis sebuah versi masuk ke production
- Menempel `git tag vX.Y.Z`
- Trigger CI/CD deploy yang bisa di-trace ke commit spesifik

Di GitHub: pilih **"Create a merge commit"**

### `main` → `develop` (back-merge) : **Merge Commit**

Wajib dilakukan setelah setiap release agar `develop` tidak tertinggal dari `main`.

### `hotfix/*` → `main` **dan** `develop` : **Merge Commit**

Hotfix harus masuk ke kedua branch agar fix tidak hilang di release berikutnya.

### Ringkasan

| Dari | Ke | Strategy |
|------|----|----------|
| `feature/*` | `develop` | Squash merge |
| `fix/*` | `develop` | Squash merge |
| `chore/*` | `develop` | Squash merge |
| `release/*` | `main` | Merge commit |
| `main` | `develop` | Merge commit (back-merge) |
| `hotfix/*` | `main` | Merge commit |
| `hotfix/*` | `develop` | Merge commit |

---

## 4. Semantic Versioning

Format: **`MAJOR.MINOR.PATCH`**

| Situasi | Bump | Contoh |
|---------|------|--------|
| Bug fix, patch kecil | PATCH | `1.0.0` → `1.0.1` |
| Fitur baru, backward compatible | MINOR | `1.0.1` → `1.1.0` |
| Breaking change, redesign besar | MAJOR | `1.1.0` → `2.0.0` |

### Panduan Kapan Bump Apa

**PATCH** — tidak ada yang berubah dari sisi user/API:
- Fix bug UI kecil
- Fix error handling
- Fix typo di label
- Performance improvement internal

**MINOR** — ada penambahan yang tidak merusak yang sudah ada:
- Layar / fitur baru
- Endpoint API baru
- Opsi konfigurasi baru
- Integrasi perangkat baru (printer, scanner)

**MAJOR** — ada perubahan yang bisa break existing behavior:
- Perubahan struktur database yang tidak backward compatible
- Perubahan format API response
- Penghapusan fitur atau endpoint yang sudah ada
- Perubahan alur autentikasi

### Pre-release Labels (opsional)

```
1.1.0-alpha.1   ← testing internal
1.1.0-beta.1    ← testing terbatas
1.1.0-rc.1      ← release candidate, siap produksi
1.1.0            ← stable release
```

---

## 5. CHANGELOG Convention

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

### Struktur

```markdown
## [Unreleased]
### Added
- Deskripsi fitur baru

## [1.1.0] - 2026-10-05
### Added
- Integrasi printer BLE thermal via @ricka7x/expo-thermal-printer

### Fixed
- Struk tidak tercetak karena ESC/POS codepage command tidak didukung printer
- Status printer tidak update di SettingsScreen setelah connect

## [1.0.0] - 2026-09-01
### Added
- Initial release
```

### Kategori Standar

| Kategori | Kapan Digunakan |
|----------|----------------|
| `Added` | Fitur baru |
| `Changed` | Perubahan fitur yang sudah ada |
| `Fixed` | Bug fix |
| `Removed` | Fitur atau API yang dihapus |
| `Deprecated` | Fitur yang akan dihapus di versi mendatang |
| `Security` | Fix terkait keamanan |

### Aturan Update CHANGELOG

- `[Unreleased]` selalu ada di paling atas sebagai akumulasi perubahan sejak release terakhir
- Saat release: rename `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`, lalu buat blok `[Unreleased]` kosong baru di atasnya
- Tulis dari perspektif user/developer yang membaca, bukan dari perspektif implementasi
- Satu bullet per perubahan, ringkas dan jelas

---

## 6. Workflow Harian (Feature/Fix)

### Langkah-langkah

```bash
# 1. Pastikan develop lokal up to date
git checkout develop
git pull origin develop

# 2. Buat branch baru dari develop
git checkout -b fix/blank-receipt-codepage

# 3. Kerjakan perubahan, commit dengan pesan yang jelas
git add src/services/printer.service.ts
git commit -m "fix: remove codepage() call causing blank receipt on cheap BLE printers"

# Boleh beberapa commit selama di branch sendiri
git add src/screens/Settings/PrinterSettingsScreen.tsx
git commit -m "fix: sync Zustand store after printer connect/disconnect"

# 4. Push branch ke remote
git push origin fix/blank-receipt-codepage

# 5. Buat Pull Request di GitHub
#    - Base branch: develop
#    - Judul PR: sama dengan commit message utama
#    - Description: jelaskan root cause dan solusi
#    - Merge strategy: Squash and merge
```

### Format Commit Message

Ikuti **Conventional Commits**:

```
<type>(<scope>): <deskripsi singkat>

[body opsional — penjelasan tambahan]

[footer opsional — breaking change / referensi issue]
```

| Type | Kapan |
|------|-------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config |
| `refactor` | Refactor tanpa ubah behavior |
| `docs` | Update dokumentasi |
| `style` | Formatting, tidak ada perubahan logic |
| `test` | Tambah atau update test |
| `perf` | Improvement performa |

**Contoh:**
```bash
git commit -m "feat: implement reprint button with BLE printer integration"
git commit -m "fix: prevent double-submit on payment confirmation"
git commit -m "fix: use MAX-based invoice number generation to prevent P2002"
git commit -m "chore: patch expo-modules-jsi for Swift 6.2 compatibility"
git commit -m "docs: add deployment guide and session changelog"
```

---

## 7. Workflow Release

### Kapan Release?

Release dilakukan ketika `develop` sudah punya cukup perubahan yang siap masuk production. Bisa berdasarkan:
- Sprint selesai
- Milestone fitur tercapai
- Akumulasi fix yang penting

### Langkah-langkah

```bash
# 1. Pastikan develop up to date dan semua PR sudah merged
git checkout develop
git pull origin develop

# 2. Buat release branch
git checkout -b release/v1.1.0

# 3. Bump versi di package.json
#    (pilih salah satu)
npm version minor --no-git-tag-version   # otomatis bump MINOR
# atau edit manual package.json: "version": "1.1.0"

# 4. Finalisasi CHANGELOG.md
#    Ganti [Unreleased] → [1.1.0] - 2026-10-05
#    Buat blok [Unreleased] kosong baru di atasnya

# 5. Commit perubahan versi
git add package.json CHANGELOG.md
git commit -m "chore: release v1.1.0"

# 6. Push release branch
git push origin release/v1.1.0

# 7. Buat PR: release/v1.1.0 → main
#    Merge strategy: Create a merge commit (BUKAN squash)
#    Judul PR: "Release v1.1.0"

# 8. Setelah PR merged ke main, buat git tag
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# 9. Back-merge main → develop
git checkout develop
git pull origin develop
git merge main --no-ff -m "chore: back-merge v1.1.0 into develop"
git push origin develop

# 10. Hapus release branch (opsional, sudah tidak dibutuhkan)
git branch -d release/v1.1.0
git push origin --delete release/v1.1.0
```

### Hal yang BOLEH dilakukan di release branch

- Bump versi di `package.json`
- Update `CHANGELOG.md`
- Fix bug ringan yang ditemukan saat testing release (bukan fitur baru)

### Hal yang TIDAK BOLEH dilakukan di release branch

- Menambah fitur baru
- Refactor besar
- Merge fitur baru dari develop

---

## 8. Hotfix Production

Digunakan ketika ada **bug kritis di production** yang tidak bisa menunggu release cycle normal.

```bash
# 1. Branch dari main (bukan develop!)
git checkout main
git pull origin main
git checkout -b hotfix/critical-payment-crash

# 2. Fix bug, commit
git add src/components/pos/PaymentModal.tsx
git commit -m "fix: prevent double-submit crash on payment confirmation"

# 3. Push dan buat PR ke main
git push origin hotfix/critical-payment-crash
# PR → main, Merge commit

# 4. Setelah merge ke main: bump PATCH version + tag
git checkout main
git pull origin main
# Edit package.json: 1.1.0 → 1.1.1
git add package.json
git commit -m "chore: bump version to 1.1.1"
git tag -a v1.1.1 -m "Hotfix v1.1.1 — payment double-submit crash"
git push origin main
git push origin v1.1.1

# 5. Back-merge ke develop (WAJIB agar fix tidak hilang)
git checkout develop
git pull origin develop
git merge main --no-ff -m "chore: back-merge hotfix v1.1.1 into develop"
git push origin develop
```

---

## 9. Cheat Sheet

### Alur Sehari-hari

```
develop → branch → kerja → PR (squash) → develop
```

### Alur Release

```
develop → release/vX.Y.Z → bump + changelog → PR (merge commit) → main
                                                                     ↓
                                                               git tag vX.Y.Z
                                                                     ↓
                                                          back-merge → develop
```

### Alur Hotfix

```
main → hotfix/xxx → fix → PR (merge commit) → main → tag → back-merge → develop
```

### Merge Strategy Summary

```
feature/* → develop   : SQUASH
fix/*     → develop   : SQUASH
chore/*   → develop   : SQUASH
release/* → main      : MERGE COMMIT
hotfix/*  → main      : MERGE COMMIT
main      → develop   : MERGE COMMIT
```

### Versioning Summary

```
Bug fix kecil     → PATCH  (1.0.0 → 1.0.1)
Fitur baru        → MINOR  (1.0.1 → 1.1.0)
Breaking change   → MAJOR  (1.1.0 → 2.0.0)
```

### Git Commands Sering Dipakai

```bash
# Lihat semua branch
git branch -a

# Hapus branch lokal yang sudah merged
git branch -d nama-branch

# Hapus branch remote
git push origin --delete nama-branch

# Lihat tag
git tag -l

# Lihat log dengan graph
git log --oneline --graph --decorate --all

# Lihat semua merge commit
git log --merges --oneline
```
