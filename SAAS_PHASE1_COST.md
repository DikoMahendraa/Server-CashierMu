# CashierMu — SaaS Phase 1: Cost Breakdown & Cara Deploy Backend

> Tujuan Phase 1: Backend bisa diakses dari internet (bukan lagi localhost).
> Pengguna bisa daftar dan login dari HP manapun, kapanpun.

---

## Daftar Isi

1. [Apa yang Dibutuhkan di Phase 1](#1-apa-yang-dibutuhkan-di-phase-1)
2. [Pilihan Hosting & Perbandingan Biaya](#2-pilihan-hosting--perbandingan-biaya)
3. [Rekomendasi: Mulai dari Nol](#3-rekomendasi-mulai-dari-nol)
4. [Total Biaya per Bulan](#4-total-biaya-per-bulan)
5. [Step-by-Step Deploy ke Railway](#5-step-by-step-deploy-ke-railway)
6. [Environment Variables yang Harus Diset](#6-environment-variables-yang-harus-diset)
7. [Test Setelah Deploy](#7-test-setelah-deploy)
8. [Kapan Harus Upgrade](#8-kapan-harus-upgrade)

---

## 1. Apa yang Dibutuhkan di Phase 1

Analoginya: saat ini backend kamu seperti warung yang hanya bisa dikunjungi kalau tamu masuk ke rumahmu. Phase 1 = pindahkan warung itu ke pinggir jalan besar, agar siapa pun bisa datang.

Ada **3 komponen** yang harus online:

| Komponen | Fungsi | Contoh (saat ini) |
|---|---|---|
| **Server (compute)** | Menjalankan kode Express/Node.js kamu | Laptop kamu (localhost) |
| **Database** | Menyimpan data permanen | PostgreSQL di Mac kamu |
| **Domain (opsional)** | Alamat yang mudah diingat | Sekarang: tidak ada |

Di Phase 1, domain **tidak wajib**. Setiap platform hosting otomatis memberikan URL gratis seperti `cashiermu-api.railway.app`. Cukup untuk mulai.

---

## 2. Pilihan Hosting & Perbandingan Biaya

### Opsi A — Railway (Rekomendasi untuk pemula)

Railway adalah platform seperti "Heroku modern" — upload kode, otomatis jalan. Cocok karena punya UI yang mudah dan semua-dalam-satu.

| Item | Biaya |
|---|---|
| Server (Node.js app) | **$5/bulan** (Hobby Plan) |
| Database PostgreSQL | **Gratis** (pakai Neon — lihat di bawah) |
| SSL/HTTPS | **Gratis** (otomatis) |
| URL publik | **Gratis** (`xxx.railway.app`) |
| **Total** | **~$5/bulan** |

> Railway Hobby Plan: 8GB RAM, unlimited projects, tidak ada sleep.
> Cocok untuk ratusan pengguna pertama.

---

### Opsi B — Render + Neon (Paling murah, ada batasan)

| Item | Biaya |
|---|---|
| Server (Render Free Tier) | **Gratis** tapi **tidur setelah 15 menit tidak ada request** |
| Server (Render Starter) | **$7/bulan** — tidak tidur |
| Database (Neon Free) | **Gratis** (0.5GB storage, cukup untuk ratusan transaksi) |
| **Total (pakai free tier)** | **$0/bulan** tapi lambat saat "bangun tidur" |
| **Total (pakai Starter)** | **~$7/bulan** |

> Neon adalah PostgreSQL serverless. Free tier-nya sangat cocok untuk Phase 1.
> URL database dari Neon bisa langsung diisi ke `DATABASE_URL` di environment variables.

---

### Opsi C — VPS (DigitalOcean / Hetzner)

Untuk yang mau lebih kontrol penuh, tapi butuh setup manual (install Node.js, PostgreSQL, nginx, SSL sendiri). Tidak direkomendasikan jika kamu masih belajar backend.

| Item | Biaya |
|---|---|
| VPS DigitalOcean (1GB RAM) | **$6/bulan** |
| VPS Hetzner CX11 (2GB RAM) | **€3.79/bulan (~$4)** |
| Database (di VPS yang sama) | **Gratis** (PostgreSQL di-install manual) |
| SSL | **Gratis** (pakai Let's Encrypt + Certbot) |
| **Total** | **~$4-6/bulan** |

> Hetzner lebih murah tapi servernya di Eropa — latency lebih tinggi untuk pengguna Indonesia.
> DigitalOcean punya region Singapore yang lebih dekat.

---

### Opsi D — Domain (Opsional di Phase 1)

Domain bukan keharusan di Phase 1. Tapi kalau mau terlihat profesional:

| Provider | Harga .com | Catatan |
|---|---|---|
| Cloudflare Registrar | **~$10/tahun** | Paling murah, tanpa markup |
| Namecheap | **~$12/tahun** | Populer, ada promo |
| GoDaddy | **~$15/tahun** | Sering ada promo tahun pertama |

> Rekomendasi: **Cloudflare** — selain domain, juga bisa pakai Cloudflare sebagai CDN dan SSL gratis.
> Alternatif domain lebih murah: `.id` di Cloudflare ~$25/tahun, `.app` ~$14/tahun.

---

## 3. Rekomendasi: Mulai dari Nol

Sebagai frontend engineer yang baru belajar SaaS, urutan terbaik:

```
Phase 1A (Bulan 1-2) — Gratis / hampir gratis
  ├── Render Free Tier (server, tidur kalau tidak ada request)
  └── Neon Free (database PostgreSQL)
  Biaya: $0/bulan
  Tujuan: validasi apakah produkmu dipakai orang

Phase 1B (Punya pengguna pertama) — Mulai bayar
  ├── Railway Hobby ($5/bulan) — server tidak tidur
  └── Neon Free atau upgrade ($19/bulan untuk 10GB)
  Biaya: ~$5-10/bulan
  Tujuan: produk stabil, pengguna tidak complaint lambat

Phase 1C (Pertumbuhan) — Tambah domain
  ├── Railway Hobby ($5/bulan)
  ├── Neon Free/Pro
  └── Domain .com via Cloudflare ($10/tahun)
  Biaya: ~$6-11/bulan
  Tujuan: branding profesional, siap pitch ke investor/user
```

---

## 4. Total Biaya per Bulan

| Skenario | Server | Database | Domain | Total |
|---|---|---|---|---|
| Gratis (testing) | Render Free | Neon Free | Tidak ada | **$0** |
| Mulai serius | Railway $5 | Neon Free | Tidak ada | **$5** |
| Profesional | Railway $5 | Neon Free | $0.83 (≈$10/tahun) | **~$6** |
| Siap scale | Railway Pro $20 | Neon Pro $19 | $0.83 | **~$40** |

> **Kesimpulan:** Untuk Phase 1, kamu bisa mulai dari **$0** dan upgrade ke **$5/bulan** saat siap.

---

## 5. Step-by-Step Deploy ke Railway

Railway dipilih karena paling mudah untuk pemula. Prosesnya mirip "push kode ke GitHub, otomatis deploy."

### Prasyarat

- Akun GitHub (kode backend harus di sana)
- Akun Railway (daftar di [railway.app](https://railway.app))
- Akun Neon untuk database (daftar di [neon.tech](https://neon.tech))

---

### Step 5.1 — Siapkan Database di Neon (gratis)

1. Daftar di **neon.tech** → klik **Create Project**
2. Isi nama project: `cashiermu`
3. Pilih region: **Singapore** (paling dekat Indonesia)
4. Setelah dibuat, klik **Dashboard** → tab **Connection Details**
5. Copy string koneksi yang bentuknya seperti ini:
   ```
   postgresql://cashiermu_owner:AbCdEf123@ep-xxx.ap-southeast-1.aws.neon.tech/cashiermu?sslmode=require
   ```
6. Simpan string ini — akan dipakai sebagai `DATABASE_URL` di Railway

---

### Step 5.2 — Push Kode Backend ke GitHub

Kode backend kamu ada di `/Users/dikomahendra/Documents/PERSONAL-PROJECTS/server-cashiermu`.

```bash
cd /Users/dikomahendra/Documents/PERSONAL-PROJECTS/server-cashiermu

# Init git (jika belum)
git init

# Buat .gitignore dulu (PENTING — jangan commit .env!)
echo "node_modules/
.env
dist/
*.log" > .gitignore

# Tambah semua file
git add .
git commit -m "Initial backend setup"

# Buat repo baru di GitHub (via browser), lalu:
git remote add origin https://github.com/USERNAMEMU/server-cashiermu.git
git push -u origin main
```

> **PENTING:** File `.env` JANGAN di-push ke GitHub karena berisi JWT secret dan database URL.
> Railway akan menerima environment variables secara terpisah (Step 5.4).

---

### Step 5.3 — Buat Project di Railway

1. Buka [railway.app](https://railway.app) → login dengan GitHub
2. Klik **New Project** → **Deploy from GitHub repo**
3. Pilih repo `server-cashiermu`
4. Railway akan otomatis detect ini adalah Node.js project
5. Tunggu deploy pertama — akan **gagal** karena belum ada environment variables. Ini normal.

---

### Step 5.4 — Set Environment Variables di Railway

Di Railway dashboard → klik project kamu → tab **Variables** → tambahkan satu per satu:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://... (paste dari Neon Step 5.1)
JWT_ACCESS_SECRET=isi_dengan_random_string_64_karakter
JWT_REFRESH_SECRET=isi_dengan_random_string_64_karakter_berbeda
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_ORIGIN=*
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=5
```

Generate JWT secrets baru (jalankan di terminal):
```bash
node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('hex'))"
# Jalankan 2x — satu untuk ACCESS_SECRET, satu untuk REFRESH_SECRET
```

---

### Step 5.5 — Tambahkan Start Script

Railway butuh tahu cara menjalankan app. Pastikan `package.json` punya script ini:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts"
  }
}
```

Jika belum ada `"start"`, tambahkan. Lalu push ke GitHub:
```bash
git add package.json
git commit -m "Add start script for production"
git push
```

Railway akan otomatis re-deploy setiap kali kamu push ke GitHub.

---

### Step 5.6 — Jalankan Migrasi Database

Setelah deploy berhasil (status hijau di Railway), jalankan migrasi Prisma:

1. Di Railway dashboard → klik project → tab **Settings** → **Generate Domain** (buat URL publik dulu)
2. Klik tab **Deploy** → **Shell** (atau gunakan Railway CLI)
3. Jalankan di shell Railway:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

> Catatan: `prisma migrate deploy` (bukan `dev`) — ini untuk production.
> `migrate deploy` hanya menjalankan migrasi yang sudah ada, tidak membuat migrasi baru.

Atau jika Railway tidak punya shell, jalankan dari laptop dengan DATABASE_URL yang diset ke Neon:
```bash
DATABASE_URL="postgresql://... (Neon URL)" npx prisma migrate deploy
DATABASE_URL="postgresql://... (Neon URL)" npm run db:seed
```

---

### Step 5.7 — Dapatkan URL Publik

Di Railway → tab **Settings** → **Networking** → klik **Generate Domain**.

Kamu akan mendapat URL seperti:
```
https://server-cashiermu-production.railway.app
```

Test:
```bash
curl https://server-cashiermu-production.railway.app/health
# Output: {"status":"ok","timestamp":"..."}
```

---

### Step 5.8 — Update Frontend

Di `src/services/api.ts` pada project React Native, ganti BASE_URL:

```typescript
// SEBELUM (lokal):
const BASE_URL = 'http://localhost:3000/api/v1';

// SESUDAH (production):
const BASE_URL = 'https://server-cashiermu-production.railway.app/api/v1';
```

Sekarang app React Native bisa dipakai dari HP manapun, dimanapun!

---

## 6. Environment Variables yang Harus Diset

Ringkasan semua variable yang perlu ada di Railway (atau platform manapun):

| Variable | Contoh Nilai | Catatan |
|---|---|---|
| `NODE_ENV` | `production` | Wajib |
| `PORT` | `3000` | Railway otomatis set ini |
| `DATABASE_URL` | `postgresql://...neon.tech/...` | Dari Neon |
| `JWT_ACCESS_SECRET` | `a1b2c3...` (64 karakter hex) | Generate baru! Jangan pakai yang di .env lokal |
| `JWT_REFRESH_SECRET` | `d4e5f6...` (64 karakter hex) | Generate baru! Berbeda dengan ACCESS |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | |
| `FRONTEND_ORIGIN` | `*` | Di Phase 1 bisa `*`, nanti dipersempit |
| `MAX_LOGIN_ATTEMPTS` | `5` | |
| `LOGIN_LOCKOUT_MINUTES` | `5` | |

> **Keamanan:** JWT Secret di production HARUS berbeda dari yang di `.env` lokal.
> Secret di production lebih panjang lebih bagus (gunakan 64 karakter, bukan 32).

---

## 7. Test Setelah Deploy

Setelah semua selesai, test endpoint penting:

```bash
# Ganti URL dengan URL Railway kamu
BASE="https://server-cashiermu-production.railway.app"

# 1. Health check
curl $BASE/health

# 2. Login (pakai data seed)
curl -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"credential":"budi@cashiermu.com","pin":"123456"}'

# 3. Simpan token dari response di atas, lalu test endpoint yang butuh auth
TOKEN="paste_access_token_disini"
curl $BASE/api/v1/store \
  -H "Authorization: Bearer $TOKEN"
```

Kalau semua response normal → backend sudah online!

---

## 8. Kapan Harus Upgrade

| Situasi | Tindakan |
|---|---|
| Server lambat / timeout sering | Upgrade Railway dari Hobby ke Pro ($20/bulan) |
| Database hampir penuh (>400MB di Neon Free) | Upgrade Neon ke Launch ($19/bulan, 10GB) |
| Butuh domain sendiri | Beli domain di Cloudflare, hubungkan ke Railway |
| Lebih dari 100 pengguna aktif | Evaluasi multi-tenant architecture |
| Butuh monitoring / alerting | Tambahkan Sentry (gratis untuk project kecil) |

---

## Ringkasan Biaya Phase 1

```
Bulan 1 (Validasi):
  Server (Render Free)    = $0
  Database (Neon Free)    = $0
  Domain                  = $0 (pakai URL gratis dari Render)
  ──────────────────────────────
  TOTAL                   = $0/bulan

Bulan 2+ (Serius):
  Server (Railway Hobby)  = $5/bulan
  Database (Neon Free)    = $0
  Domain (Cloudflare .com) = $0.83/bulan (dibayar $10/tahun)
  ──────────────────────────────
  TOTAL                   = ~$6/bulan

Setara dengan: 1 kopi kekinian per bulan.
```

---

## Checklist Deploy Phase 1

- [ ] Kode backend sudah di GitHub (tanpa file `.env`)
- [ ] Akun Neon dibuat, database `cashiermu` sudah ada, URL koneksi disimpan
- [ ] Akun Railway dibuat, project dibuat dari GitHub repo
- [ ] Semua environment variables diset di Railway
- [ ] `package.json` punya script `"start": "node dist/app.js"` dan `"build": "tsc"`
- [ ] Deploy berhasil (status hijau di Railway)
- [ ] Migrasi dijalankan (`prisma migrate deploy`)
- [ ] Seed data dijalankan (`npm run db:seed`)
- [ ] URL publik sudah di-generate
- [ ] Health check berhasil (`/health` return `{"status":"ok"}`)
- [ ] Login berhasil dengan data seed
- [ ] BASE_URL di frontend sudah diupdate ke URL Railway
