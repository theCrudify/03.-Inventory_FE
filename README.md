# Arunika IT Inventory — Frontend (`03.-Inventory_FE`)

Frontend aplikasi prototype **IT Inventory Kawasan Berikat**: pengelolaan dokumen kepabeanan BC 2.3 sampai BC 4.1, integrasi simulasi CEISA 4.0, kartu stok barang, dan laporan mutasi pabean. Perusahaan, mitra, dan transaksi di dalamnya fiktif untuk portofolio teknis.

| Informasi | Keterangan |
|---|---|
| **Aplikasi Live (UI)** | [inventory-ui-rho-ten.vercel.app](https://inventory-ui-rho-ten.vercel.app) |
| **Backend API** | [inventory-api.jidanfatahillah2003.workers.dev](https://inventory-api.jidanfatahillah2003.workers.dev) |
| **Tech Stack** | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · lucide-react · SheetJS (xlsx) |
| **Database** | Neon Serverless PostgreSQL (`new_inventory`) |
| **Repositori Terkait** | `03.-Inventory_BE` (API Hono / Cloudflare Workers), `03.-Inventory_FE` (UI Next.js) |

---

## Daftar Isi

1. [Video Demo](#1-video-demo)
2. [Akun Demo dan Hak Akses](#2-akun-demo-dan-hak-akses)
3. [Panduan Pengguna & Screenshot Fitur](#3-panduan-pengguna--screenshot-fitur)
   - [3.1 Dashboard](#31-dashboard)
   - [3.2 Sumber Dokumen (PO & Invoice)](#32-sumber-dokumen-purchase-order-dan-commercial-invoice)
   - [3.3 Dokumen Kepabeanan BC](#33-dokumen-bc)
   - [3.4 Laporan Mutasi Barang](#34-laporan-mutasi)
   - [3.5 Master Data](#35-master-data)
   - [3.6 Pengaturan (Admin)](#36-pengaturan-admin)
   - [3.7 Akun, Tema Gelap/Terang, Bahasa, dan Tampilan Mobile](#37-akun-tema-bahasa-dan-layar-kecil)
4. [Alur Dokumen dan Simulasi CEISA](#4-alur-dokumen-dan-ceisa-tiruan)
5. [Arsitektur & Desain Sistem Frontend](#5-arsitektur--desain-sistem-frontend)
6. [Struktur Folder Repositori](#6-struktur-folder-repositori)
7. [Database & ERD](#7-database)
8. [Integrasi API](#8-api)
9. [Konfigurasi Lingkungan (`.env`)](#9-konfigurasi-env)
10. [Menjalankan Lokal](#10-menjalankan-lokal)
11. [Deployment (Vercel)](#11-deploy-vercel)
12. [Keamanan](#12-keamanan)
13. [Batasan yang Diketahui](#13-batasan-yang-diketahui)

---

## 1. Video Demo

Alur operator dari awal sampai akhir (90 detik): login, dashboard KPI, daftar BC 2.3, membuka dokumen draft, **Kirim ke CEISA**, status berjalan otomatis (*Draft* $\to$ *Terkirim* $\to$ *Diterima CEISA* $\to$ *Tervalidasi* $\to$ *SPPB disetujui*), pengecekan saldo kartu stok, laporan mutasi bahan baku, hingga master barang.

<video src="video/demo.mp4" controls width="860"></video>

> File lokal: [`video/demo.mp4`](video/demo.mp4) dan [`video/demo.webm`](video/demo.webm).

---

## 2. Akun Demo dan Hak Akses

Password semua akun demo: `demo1234`. Pada halaman login, klik kartu role untuk pengisian instan satu kali klik.

| Role | Email | Hak Akses |
|---|---|---|
| **Admin** | `admin@arunika.demo` | Akses penuh seluruh modul: manajemen pengguna, role, status dokumen, tarif referensi, audit log, pengaturan perusahaan, serta seluruh dokumen operasional. |
| **Operator** | `operator@arunika.demo` | Membaca semua modul; membuat, mengubah, menghapus, serta mengirim dokumen pabean, PO/Invoice, barang, dan mitra. |
| **Viewer** | `viewer@arunika.demo` | *Read-only* (khusus auditor/inspeksi); tombol tambah/ubah/hapus/kirim disembunyikan dan menu Pengaturan dikunci. |

Izin diverifikasi langsung dari database (`can_write`, `is_admin`) pada setiap request ke API.

![Halaman login dengan kartu akun demo](screenshots/01-login.png)
*Halaman login dengan kartu akun demo*

![Tampilan Viewer: tombol ubah, hapus, dan kirim tidak tersedia](screenshots/28-viewer-readonly.png)
*Tampilan Viewer: tombol ubah, hapus, dan kirim tidak tersedia*

![Viewer yang membuka halaman admin mendapat penolakan dari API (403)](screenshots/29-viewer-akses-ditolak.png)
*Viewer yang membuka halaman admin mendapat penolakan dari API (403)*

---

## 3. Panduan Pengguna & Screenshot Fitur

### 3.1 Dashboard
Ringkasan KPI status dokumen, grafik tren nilai pabean 6 bulan terakhir (pemasukan vs pengeluaran), rincian dokumen per jenis BC, feed respon CEISA terkini, serta ringkasan barang terdaftar. Shortcut tombol **+ BC 2.3** dan **+ BC 3.0** langsung membuka pembuatan dokumen baru.

![Dashboard](screenshots/02-dashboard.png)
*Dashboard Utama*

---

### 3.2 Sumber Dokumen: Purchase Order dan Commercial Invoice
Dasar dokumen pabean. Dokumen BC dapat digenerate langsung dari PO atau Invoice sehingga identitas mitra usaha, valuta, dan baris barang otomatis terisi tanpa input ulang. Dilengkapi pencarian real-time, sorting kolom, dan modal form yang bersih.

![Daftar Purchase Order](screenshots/03-sumber-po.png)
*Daftar Purchase Order*

![Daftar Commercial Invoice](screenshots/04-sumber-invoice.png)
*Daftar Commercial Invoice*

---

### 3.3 Dokumen BC
Mendukung 9 jenis dokumen kepabeanan:
- **Dokumen Pemasukan:** BC 2.3 (Impor KB), BC 2.6.2 (Masuk Subkon), BC 2.7 Masuk (Antar KB), BC 4.0 (LDP Masuk).
- **Dokumen Pengeluaran:** BC 2.5 (Penyerahan ke TLDDP), BC 2.6.1 (Keluar Subkon), BC 2.7 Keluar (Antar KB), BC 3.0 (Ekspor), BC 4.1 (LDP Keluar).

Tabel dilengkapi pencarian multi-kolom, filter status, filter rentang tanggal cerdas (bebas backdate), serta sorting interaktif.

![Daftar dokumen BC 2.3 dengan filter status dan tanggal](screenshots/05-dokumen-daftar.png)
*Daftar dokumen BC 2.3 dengan filter status dan tanggal*

**Pembuatan Dokumen:**
Formulir terbagi rapi menjadi: Data Umum, Sarana Pengangkut, Kemasan & Peti Kemas, Dokumen Pelengkap, serta Pos Tarif Barang. Panel samping menghitung estimasi pungutan (Bea Masuk, PPN, PPh) secara live berdasarkan master HS Code.

![Form pembuatan BC 2.3](screenshots/12-dokumen-baru.png)
*Form pembuatan BC 2.3*

**Detail Dokumen & Siklus CEISA:**
Stepper visual menunjukkan posisi status dokumen di CEISA. Tab navigasi memisahkan Data Umum, Pos Barang, Pungutan, dan Log Respon CEISA.

![Dokumen berstatus Draft, siap dikirim](screenshots/06-dokumen-draft.png)
*Dokumen berstatus Draft, siap dikirim ke CEISA*

![Tab Barang: baris barang dengan HS code, jumlah, dan nilai](screenshots/09-dokumen-barang.png)
*Rincian pos barang dalam dokumen*

![Tab Pungutan: BM, PPN, PPh, dan total](screenshots/10-dokumen-pungutan.png)
*Kalkulasi pungutan impor*

![Tab Respon CEISA: riwayat respon beserta payload](screenshots/11-dokumen-respon-ceisa.png)
*Audit trail respon resmi simulasi CEISA 4.0*

![Dokumen disetujui: nomor dan tanggal pendaftaran terisi](screenshots/08-dokumen-disetujui.png)
*Dokumen SPPB disetujui Bea Cukai*

![Dokumen ditolak: alasan ditampilkan, perbaiki lalu Kirim Ulang](screenshots/07-dokumen-ditolak.png)
*Penolakan dokumen dengan kode kesalahan dan opsi perbaikan*

**Cetak Dokumen:**
Tampilan cetak siap cetak atau ekspor PDF dengan layout standar dokumen kepabeanan formal.

![Halaman cetak dokumen](screenshots/23-cetak.png)
*Layout cetak dokumen pabean*

---

### 3.4 Laporan Mutasi
Laporan pertanggungjawaban mutasi barang per kategori (Bahan Baku & Penolong, Barang Jadi, Mesin & Peralatan, Sisa & Scrap):
- Menampilkan: Saldo Awal, Pemasukan, Pengeluaran, Penyesuaian, dan Saldo Akhir.
- Filter periode tanggal terintegrasi (otomatis menjaga rentang valid).
- Ekspor spreadsheet Excel (`.xlsx`) instan menggunakan SheetJS.
- Mutasi stok hanya dibukukan saat dokumen berstatus **disetujui (SPPB)**.

![Laporan mutasi bahan baku](screenshots/13-laporan-bahan-baku.png)
*Laporan mutasi stok bahan baku*

---

### 3.5 Master Data
- **Master Barang:** kode barang, nama, kategori, HS Code 8-digit, satuan, dan akumulasi saldo fisik real-time.
- **Master Mitra Usaha:** direktori pemasok (*supplier*) dan pembeli (*customer*) lokal maupun internasional.
- **Master Referensi & Tarif:** pengelolaan referensi negara, pelabuhan, kemasan, kurs valuta, kantor pabean, incoterm, dan tarif bea masuk.

![Master barang beserta saldo](screenshots/14-master-barang.png)
*Master data barang dan saldo stok*

![Master mitra](screenshots/15-master-mitra.png)
*Master direktori mitra usaha*

![Master referensi dan tarif](screenshots/16-master-referensi.png)
*Master referensi dan tarif kepabeanan*

---

### 3.6 Pengaturan (Admin)
Konfigurasi profil perusahaan Kawasan Berikat, manajemen akun pengguna, master role (*RBAC*), siklus status dokumen, dan audit log menyeluruh.

![Profil perusahaan](screenshots/17-pengaturan-perusahaan.png)
*Pengaturan profil perusahaan dan nomor izin KB*

![Manajemen pengguna](screenshots/18-pengaturan-pengguna.png)
*Daftar pengguna dan manajemen akses*

![Master role (can_write, is_admin)](screenshots/19-pengaturan-role.png)
*Konfigurasi hak role*

![Master status dokumen](screenshots/20-pengaturan-status.png)
*Master siklus status dokumen pabean*

![Audit log: login dan setiap perubahan data](screenshots/21-audit-log.png)
*Audit trail seluruh perubahan data & aktivitas login*

---

### 3.7 Akun, Tema, Bahasa, dan Layar Kecil
- Penggantian password dengan validasi keamanan.
- **Mode Gelap (Dark Mode)** dan **Mode Terang (Light Mode)** yang konsisten dengan token warna Slate/Teal.
- **Dwi Bahasa (Bilingual):** peralihan instan antara Bahasa Indonesia (ID) dan English (EN).
- **Layout Responsif:** navigasi *drawer mobile* yang nyaman di perangkat smartphone dan tablet.

![Halaman akun](screenshots/22-akun.png)
*Pengaturan akun pengguna*

![Mode gelap](screenshots/24-dashboard-gelap.png)
*Dashboard dalam Mode Gelap*

![Bahasa Inggris](screenshots/25-dashboard-en.png)
*Dashboard dalam Bahasa Inggris (EN)*

<table><tr>
<td align="center"><img src="screenshots/26-mobile-dashboard.png" width="300" alt="Dashboard Mobile"><br><em>Dashboard pada Mobile</em></td>
<td align="center"><img src="screenshots/27-mobile-dokumen.png" width="300" alt="Daftar Dokumen Mobile"><br><em>Daftar Dokumen pada Mobile</em></td>
</tr></table>

---

## 4. Alur Dokumen dan CEISA Tiruan

```
[Draft] ---> [Terkirim] ---> [Diterima CEISA] ---> [Tervalidasi] ---> [SPPB (Disetujui)]
                                     \
                                      +---> [Ditolak] (Kode 900, alasan error ditampilkan)
```

1. **Validasi CEISA:** Tombol **Kirim ke CEISA** melakukan validasi format dokumen (HS Code wajib 8 digit, kelengkapan sarana pengangkut, dan ketersediaan stok untuk dokumen pengeluaran).
2. **Kondisi Penolakan:** Dokumen yang tidak valid otomatis ditolak (kode 900) dengan deskripsi galat yang jelas. Operator dapat memperbaiki data dan menekan tombol *Kirim Ulang*.
3. **Pencatatan Stok Bersyarat:** Saldo stok bertambah/berkurang hanya pada transisi status SPPB (disetujui). Update bersyarat di level database memastikan tidak pernah terjadi *double booking*.
4. **Mock Gateway CEISA & INSW:** Gateway menyediakan endpoint simulasi berstandar OpenAPI (`POST /mock-ceisa/nle-oauth/v1/user/login`, `GET /mock-ceisa/openapi/status/{nomorAju}`, dan `GET /insw/hs/{kodeHs}`).

---

## 5. Arsitektur & Desain Sistem Frontend

### Arsitektur Berbasis Metadata (`Data-Driven`)
Semua label, daftar opsi dropdown, menu jenis dokumen BC, kategori laporan mutasi, konfigurasi field form (impor vs ekspor, perlunya jaminan, kantor pabean default), tarif perhitungan pungutan, profil perusahaan, hingga nama aplikasi diambil dari endpoint `GET /meta` lewat hook `useMeta()` ([lib/meta.tsx](file:///home/jidan/Documents/00.%20IDS_DEV/01.%20YKK/03.-Inventory_FE/lib/meta.tsx)). Tidak ada *hardcoded business logic* di kode antarmuka.

### Fondasi Komponen Reusable ([components/ui.tsx](file:///home/jidan/Documents/00.%20IDS_DEV/01.%20YKK/03.-Inventory_FE/components/ui.tsx))
- **`DateField`:** Input tanggal terformat lokal (`23 Nov 2026`) dengan popover kalender native tanpa layout clunky browser bawaan.
- **`FilterDateRange`:** Filter rentang tanggal cerdas berbentuk *pill* yang menjaga constraint validasi (mencegah tanggal akhir lebih awal daripada tanggal awal / *no backdate*).
- **`Modal` dengan React Portal:** Dialog di-*render* langsung ke `document.body` via `createPortal`, memastikan backdrop gelap (`bg-slate-950/45 backdrop-blur-[2px]`) menutup 100% layar dari ujung ke ujung tanpa terpotong oleh CSS transform induk.
- **`Table`:** Komponen tabel modern dengan sorting dua arah, header rata kanan untuk angka uang/kuantitas, pagination terintegrasi, dan *skeleton loading* saat persiapan data.
- **`SearchInput`:** Input pencarian dengan tombol hapus instan dan indikator spinner animasi debounced.

---

## 6. Struktur Folder Repositori

```
03.-Inventory_FE/
├── app/
│   ├── (app)/                    # Area terautentikasi (dilindungi Shell & MetaProvider)
│   │   ├── page.tsx              # Dashboard KPI & visualisasi tren
│   │   ├── sumber-dokumen/[kind] # PO & Commercial Invoice
│   │   ├── dokumen/[jenis]/      # Daftar dokumen BC (2.3 s.d. 4.1)
│   │   │   ├── baru/page.tsx     # Form wizard dokumen pabean baru
│   │   │   ├── [id]/page.tsx     # Detail dokumen, tab pungutan & CEISA
│   │   │   └── [id]/ubah/        # Form revisi dokumen draft/ditolak
│   │   ├── laporan/[kategori]/   # Laporan mutasi stok (ekspor XLSX)
│   │   ├── master/               # Master barang, mitra usaha, referensi & tarif
│   │   ├── pengaturan/           # Profil perusahaan, users, roles, audit log
│   │   └── akun/page.tsx         # Manajemen profil akun pengguna
│   ├── login/page.tsx            # Halaman login dengan kartu role demo
│   ├── cetak/[id]/page.tsx       # Layout cetak formal dokumen kepabeanan
│   ├── globals.css               # Design tokens Tailwind CSS 4 & animasi
│   └── layout.tsx                # Root layout & Toaster notification
├── components/
│   ├── ui.tsx                    # Shared UI primitives (Button, Modal, Table, DateField)
│   ├── shell.tsx                 # App layout, sidebar accordion, navbar & user menu
│   ├── doc-form.tsx              # Form dinamis 5 bagian dokumen pabean
│   └── crud-page.tsx             # Abstraksi halaman tabel CRUD master
├── lib/
│   ├── api.ts                    # HTTP client wrapper (fetch, auth header, token)
│   ├── auth.tsx                  # Context autentikasi, status role, dan permission check
│   ├── meta.tsx                  # Cache master metadata data-driven
│   ├── prefs.tsx                 # State tema (gelap/terang) & bahasa (ID/EN)
│   ├── i18n.ts                   # Kamus terjemahan dwibahasa
│   ├── format.ts                 # Formatter tanggal lokal, angka tabular, dan mata uang
│   └── xlsx.ts                   # Engine generator file Excel laporan mutasi
├── screenshots/                  # Aset visual dokumentasi
└── video/                        # Video demo operasional
```

---

## 7. Database

Database relasional murni di PostgreSQL (Neon): **41 tabel, 53 foreign key, tanpa kolom JSON tidak terstruktur**. Seluruh referensi memiliki integritas relasi yang ketat.

### Diagram Relasi Utama (ERD Ringkas)
```mermaid
erDiagram
  bc_types ||--o{ customs_docs : "bc_type"
  partners ||--o{ customs_docs : "partner_id"
  trade_docs ||--o{ customs_docs : "trade_doc_id"
  customs_docs ||--o{ customs_doc_lines : "doc_id"
  customs_docs ||--o{ customs_doc_events : "doc_id"
  customs_docs ||--o{ stock_movements : "doc_id"
  items ||--o{ customs_doc_lines : "item_id"
  items ||--o{ stock_movements : "item_id"
  users ||--o{ customs_docs : "created_by"
  users ||--o{ audit_logs : "user_id"
  roles ||--o{ users : "role"
```

---

## 8. API

Seluruh request dari frontend (kecuali `/auth/login` dan `/meta/public`) melampirkan header `Authorization: Bearer <token>`.

| Kategori Endpoint | Path | Akses |
|---|---|---|
| Autentikasi | `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password` | Publik / Login |
| Metadata | `GET /meta`, `GET /meta/public` | Publik / All Roles |
| Dashboard | `GET /dashboard` | All Roles |
| Master & Sumber | `GET, POST, PUT, DELETE /items`, `/partners`, `/trade-docs` | Read (All) / Write (Operator, Admin) |
| Dokumen Pabean | `GET, POST, PUT, DELETE /customs-docs`, `POST /customs-docs/:id/submit` | Read (All) / Write (Operator, Admin) |
| Laporan Mutasi | `GET /reports/mutasi` | All Roles |
| Administrasi | `GET, PUT /settings/:key`, `/users`, `/roles`, `/audit-logs` | Admin |
| Gateway CEISA | `/mock-ceisa/nle-oauth/v1/user/login`, `/mock-ceisa/openapi/status/:aju` | Simulasi API Gateway |

---

## 9. Konfigurasi Lingkungan (`.env`)

Buat berkas `.env.local` di folder `03.-Inventory_FE/`:

```env
# Alamat URL backend API (tanpa tanda garis miring di akhir)
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Untuk produksi, isi dengan URL Cloudflare Worker:
```env
NEXT_PUBLIC_API_URL=https://inventory-api.jidanfatahillah2003.workers.dev
```

---

## 10. Menjalankan Lokal

Pastikan Node.js 20+ sudah terpasang. Backend API di `03.-Inventory_BE` harus sudah berjalan di port 8787.

```bash
# 1. Masuk ke direktori frontend
cd 03.-Inventory_FE

# 2. Pasang dependensi
npm install

# 3. Buat file environment lokal
echo 'NEXT_PUBLIC_API_URL=http://localhost:8787' > .env.local

# 4. Jalankan development server
npm run dev
# Buka http://localhost:3000 di browser

# Atau jalankan build produksi lokal:
npm run build
npm start -p 3000
```

---

## 11. Deploy (Vercel)

Variabel yang dibutuhkan: `NEXT_PUBLIC_API_URL`. Nilai ini tertanam saat proses build frontend.

### Opsi A: Deployment via Vercel CLI
```bash
# Login ke Vercel (cukup sekali)
npx vercel login

# Hubungkan proyek
npx vercel link

# Tambahkan environment variable produksi
npx vercel env add NEXT_PUBLIC_API_URL production

# Build dan deploy ke produksi
npx vercel deploy --prod
```

### Opsi B: Deployment Otomatis via Git Push
1. Push branch `main` repositori ke GitHub.
2. Di dashboard [vercel.com](https://vercel.com), pilih **Add New Project**, lalu import repositori ini.
3. Tambahkan environment variable `NEXT_PUBLIC_API_URL` dengan URL worker backend.
4. Setiap push ke branch `main` akan otomatis memicu build dan rilis produksi di Vercel.

> **Catatan CORS:** Jika domain frontend berubah, pastikan domain baru telah didaftarkan pada variabel `CORS_ORIGINS` di file `wrangler.toml` backend `03.-Inventory_BE`.

---

## 12. Keamanan

1. **Role-Based Access Control (RBAC):** Hak akses diverifikasi di level endpoint backend pada setiap request; UI secara reaktif menyembunyikan tombol mutasi data untuk role non-operator/non-admin.
2. **Perlindungan IDOR:** Setiap aksi kepemilikan data mengacu pada identitas JWT terenkripsi, bukan dari parameter yang dikirim user.
3. **Penyimpanan Token:** Token sesi disimpan di `localStorage` dan otomatis divalidasi serta dihapus saat kedaluwarsa (401).
4. **Keamanan Konten:** Konfigurasi CSP (*Content Security Policy*) ketat, proteksi *Clickjacking* (`X-Frame-Options: DENY`), dan `X-Content-Type-Options: nosniff`.

---

## 13. Batasan yang Diketahui

- **Sumber PO & Invoice:** Pada prototype ini, PO dan Invoice diinput melalui antarmuka CRUD form. Pada implementasi industri, data ini umumnya diintegrasikan langsung dari sistem ERP perusahaan (SAP, Oracle, Odoo) via API atau file staging.
- **Simulasi CEISA:** Seluruh respon Bea Cukai dan nomor pendaftaran merupakan respon simulasi sandbox (tidak terhubung ke server produksi Bea Cukai resmi).
- **Cold Start Neon Free-Tier:** Database Neon dapat memasuki mode standby bila tidak diakses selama periode tertentu, sehingga request awal dapat memerlukan waktu 1-2 detik untuk bangun.
