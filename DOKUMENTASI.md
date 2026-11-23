# Dokumentasi Arunika IT Inventory

Prototype **IT Inventory Kawasan Berikat**: dokumen kepabeanan BC 2.3 sampai 4.1, integrasi CEISA 4.0 (tiruan),
kartu stok, dan laporan mutasi. Perusahaan, mitra, dan transaksi di dalamnya fiktif. Dibuat untuk portofolio.

| | |
|---|---|
| Aplikasi (UI) | https://inventory-ui-rho-ten.vercel.app |
| API | https://inventory-api.jidanfatahillah2003.workers.dev |
| Database | Neon PostgreSQL, database `new_inventory` (nama sama dengan lokal) |
| Kode | `03.-Inventory_BE` (API), `03.-Inventory_FE` (UI) |

## Daftar isi

1. [Video demo](#1-video-demo)
2. [Akun demo dan hak akses](#2-akun-demo-dan-hak-akses)
3. [Panduan pengguna](#3-panduan-pengguna)
4. [Alur dokumen dan CEISA tiruan](#4-alur-dokumen-dan-ceisa-tiruan)
5. [Arsitektur](#5-arsitektur)
6. [Database](#6-database)
7. [API](#7-api)
8. [Konfigurasi](#8-konfigurasi-env)
9. [Menjalankan lokal](#9-menjalankan-lokal)
10. [Deploy](#10-deploy)
11. [Keamanan](#11-keamanan)
12. [Pengujian](#12-pengujian)
13. [Pemeliharaan](#13-pemeliharaan)
14. [Batasan](#14-batasan-yang-diketahui)

---

## 1. Video demo

Alur operator dari awal sampai akhir (90 detik): login, dashboard, daftar BC 2.3, membuka dokumen draft, **Kirim ke CEISA**,
status berjalan Draft, Terkirim, Diterima CEISA, Tervalidasi, SPPB (disetujui), lalu laporan mutasi dan master barang.

[![Demo Video Arunika IT Inventory](video/demo.gif)](video/demo.mp4)

File: [`video/demo.mp4`](video/demo.mp4) (dan [`demo.webm`](video/demo.webm)). Jika video tidak tampil di penampil Markdown Anda, buka `index.html`.

## 2. Akun demo dan hak akses

Password semua akun demo: `demo1234`. Di halaman login, klik kartu role untuk mengisi otomatis.

| Role | Email | Boleh |
|---|---|---|
| Admin | `admin@arunika.demo` | Semua, termasuk pengguna, role, status, referensi, pengaturan, audit log |
| Operator | `operator@arunika.demo` | Membaca semua; membuat, mengubah, menghapus, dan mengirim dokumen, barang, mitra |
| Viewer | `viewer@arunika.demo` | Hanya membaca (auditor); menu Pengaturan tidak tampil |

Izin dibaca dari tabel `roles` (`can_write`, `is_admin`) pada setiap permintaan, bukan dari token. Detail matriks per endpoint ada di
`03.-Inventory_BE/SECURITY.md`.

![Halaman login dengan kartu akun demo](screenshots/01-login.png)
*Halaman login dengan kartu akun demo*

![Tampilan Viewer: tombol ubah, hapus, dan kirim tidak tersedia](screenshots/28-viewer-readonly.png)
*Tampilan Viewer: tombol ubah, hapus, dan kirim tidak tersedia*

![Viewer yang membuka halaman admin mendapat penolakan dari API (403)](screenshots/29-viewer-akses-ditolak.png)
*Viewer yang membuka halaman admin mendapat penolakan dari API (403)*


## 3. Panduan pengguna

### 3.1 Dashboard
Ringkasan jumlah dokumen per status, grafik nilai pabean dokumen disetujui 6 bulan terakhir (pemasukan dan pengeluaran),
rincian per jenis BC, respon CEISA terbaru, dan jumlah barang terdaftar. Tombol **+ BC 2.3** dan **+ BC 3.0** membuat dokumen baru.

![Dashboard](screenshots/02-dashboard.png)
*Dashboard*


### 3.2 Sumber dokumen: Purchase Order dan Commercial Invoice
Dasar dokumen pemasukan. Dokumen BC dapat dibuat dari PO atau invoice sehingga mitra, valuta, dan barang terisi otomatis.
Di prototype ini PO dan invoice diisi lewat form CRUD; pada sistem asli data ini datang dari ERP (lihat [Batasan](#14-batasan-yang-diketahui)).

![Daftar Purchase Order](screenshots/03-sumber-po.png)
*Daftar Purchase Order*

![Daftar Commercial Invoice](screenshots/04-sumber-invoice.png)
*Daftar Commercial Invoice*


### 3.3 Dokumen BC
Menu **Dokumen Pemasukan** (BC 2.3, 2.6.2, 2.7 masuk, 4.0) dan **Dokumen Pengeluaran** (BC 2.5, 2.6.1, 2.7 keluar, 3.0, 4.1).
Daftar dapat difilter status dan tanggal, dicari, dan diurutkan.

![Daftar dokumen BC 2.3 dengan filter status dan tanggal](screenshots/05-dokumen-daftar.png)
*Daftar dokumen BC 2.3 dengan filter status dan tanggal*


**Membuat dokumen.** Klik **Buat BC x.x**. Form dibagi lima bagian: Data Umum, Pengangkutan, Kemasan & Kontainer, Dokumen Pelengkap, Data Barang.
Panel kanan menampilkan estimasi pungutan (BM, PPN, PPh) yang dihitung dari tarif HS di master. Semua pilihan dropdown berasal dari master database.

![Form pembuatan BC 2.3](screenshots/12-dokumen-baru.png)
*Form pembuatan BC 2.3*


**Detail dokumen.** Stepper menunjukkan tahap CEISA. Tab: Data Umum, Barang, Pungutan, Respon CEISA. Tombol: Cetak, Hapus, Ubah, Kirim ke CEISA.

![Dokumen berstatus Draft, siap dikirim](screenshots/06-dokumen-draft.png)
*Dokumen berstatus Draft, siap dikirim*

![Tab Barang: baris barang dengan HS code, jumlah, dan nilai](screenshots/09-dokumen-barang.png)
*Tab Barang: baris barang dengan HS code, jumlah, dan nilai*

![Tab Pungutan: BM, PPN, PPh, dan total](screenshots/10-dokumen-pungutan.png)
*Tab Pungutan: BM, PPN, PPh, dan total*

![Tab Respon CEISA: riwayat respon beserta payload](screenshots/11-dokumen-respon-ceisa.png)
*Tab Respon CEISA: riwayat respon beserta payload*

![Dokumen disetujui: nomor dan tanggal pendaftaran terisi](screenshots/08-dokumen-disetujui.png)
*Dokumen disetujui: nomor dan tanggal pendaftaran terisi*

![Dokumen ditolak: alasan ditampilkan, perbaiki lalu Kirim Ulang](screenshots/07-dokumen-ditolak.png)
*Dokumen ditolak: alasan ditampilkan, perbaiki lalu Kirim Ulang*


Dokumen yang sudah dikirim tidak dapat diubah atau dihapus. Dokumen ditolak atau draft dapat diubah; menyimpan perubahan mengembalikannya ke status awal.

**Cetak.** Tombol Cetak membuka halaman siap cetak/PDF.

![Halaman cetak dokumen](screenshots/23-cetak.png)
*Halaman cetak dokumen*


### 3.4 Laporan mutasi
Laporan per kategori barang (Bahan Baku & Penolong, Barang Jadi, Mesin & Peralatan, Sisa & Scrap): saldo awal, pemasukan, pengeluaran, penyesuaian, saldo akhir. Dapat difilter periode dan diekspor ke XLSX.
Saldo dibukukan hanya setelah dokumen **disetujui**.

![Laporan mutasi bahan baku](screenshots/13-laporan-bahan-baku.png)
*Laporan mutasi bahan baku*


### 3.5 Master data
- **Barang**: kode, uraian, kategori, HS code, satuan, saldo.
- **Mitra**: pemasok dan pembeli.
- **Referensi & Tarif**: negara, pelabuhan, satuan, kemasan, valuta dan kurs, kantor pabean, incoterm, HS code dan tarif, dan seterusnya (admin dapat mengubah).

![Master barang beserta saldo](screenshots/14-master-barang.png)
*Master barang beserta saldo*

![Master mitra](screenshots/15-master-mitra.png)
*Master mitra*

![Master referensi dan tarif](screenshots/16-master-referensi.png)
*Master referensi dan tarif*


### 3.6 Pengaturan (admin)
Profil perusahaan, pengguna, role, status dokumen, dan audit log. Role dan status adalah tabel master: menambah role atau status cukup menambah baris.

![Profil perusahaan](screenshots/17-pengaturan-perusahaan.png)
*Profil perusahaan*

![Manajemen pengguna](screenshots/18-pengaturan-pengguna.png)
*Manajemen pengguna*

![Master role (can_write, is_admin)](screenshots/19-pengaturan-role.png)
*Master role (can_write, is_admin)*

![Master status dokumen](screenshots/20-pengaturan-status.png)
*Master status dokumen*

![Audit log: login dan setiap perubahan data](screenshots/21-audit-log.png)
*Audit log: login dan setiap perubahan data*


### 3.7 Akun, tema, bahasa, dan layar kecil
Halaman **Akun** untuk mengganti password (10 sampai 128 karakter, wajib huruf dan angka; akun demo tidak dapat diganti). Tersedia mode gelap, bahasa ID/EN, dan tampilan seluler.

![Halaman akun](screenshots/22-akun.png)
*Halaman akun*

![Mode gelap](screenshots/24-dashboard-gelap.png)
*Mode gelap*

![Bahasa Inggris](screenshots/25-dashboard-en.png)
*Bahasa Inggris*


<table><tr>
<td><img src="screenshots/26-mobile-dashboard.png" width="260" alt="Dashboard seluler"></td>
<td><img src="screenshots/27-mobile-dokumen.png" width="260" alt="Daftar dokumen seluler"></td>
</tr></table>

## 4. Alur dokumen dan CEISA tiruan

```
Draft -> Terkirim -> Diterima CEISA -> Tervalidasi -> SPPB (disetujui)
                          \-> Ditolak (kode 900, alasan ditampilkan)
```

- **Kirim ke CEISA** memvalidasi dokumen seperti CEISA: HS code 8 digit dan data pengangkut wajib. Yang tidak lolos **ditolak (kode 900)**.
- Dokumen pengeluaran dicek ke saldo stok. Stok baru dibukukan setelah dokumen disetujui.
- Tahap dan jeda waktunya ada di tabel `ceisa_stages` (bukan di kode). Tahap berikutnya terbentuk saat dokumen dibaca (`advance()`),
  memakai update bersyarat sehingga stok tidak pernah terbukukan dua kali walau dibuka bersamaan.
- Gateway tiruan mengikuti bentuk aslinya: `POST /mock-ceisa/nle-oauth/v1/user/login` dan `GET /mock-ceisa/openapi/status/{nomorAju}`
  memakai token sendiri yang **tidak berlaku** di API aplikasi. Mock INSW: `GET /insw/hs/{kodeHs}`.

## 5. Arsitektur

```
Browser --> Next.js 16 (Vercel) --HTTPS+JWT--> Hono API (Cloudflare Workers) --postgres.js--> Neon PostgreSQL
```

| Lapisan | Teknologi |
|---|---|
| UI | Next.js 16 (App Router), React 19, Tailwind 4, lucide-react |
| API | Hono, Zod 4, Drizzle ORM, JWT HS256, PBKDF2-SHA256 (WebCrypto) |
| Data | PostgreSQL (Neon, gratis), satu database `new_inventory` |

Struktur API: setiap modul punya lima berkas, yaitu `dto` (validasi), `repository` (query), `service` (logika + audit), `controller` (HTTP), `routes` (path + role).

```
src/modules/<modul>/<modul>.{dto,repository,service,controller,routes}.ts
```

Modul: auth, users, settings, refs, roles, document-statuses, items, partners, trade-docs, customs-docs, ceisa-mock, dashboard, reports, audit.
UI sepenuhnya digerakkan data: label, menu BC, aturan form, tarif, dan branding diambil dari `GET /meta`, tanpa nilai bisnis di kode UI.

## 6. Database

**SQL relasional murni: 41 tabel, 53 foreign key, tanpa kolom JSON dan tanpa enum.** Setiap daftar acuan punya tabel sendiri dengan kode sebagai kunci,
sehingga PostgreSQL menolak kode yang tidak terdaftar. Perilaku aplikasi (hak role, siklus status, aturan per jenis BC, tahap CEISA) tersimpan sebagai kolom di tabel master.

| Kelompok | Tabel |
|---|---|
| Akses & siklus dokumen | `roles`, `document_statuses` |
| Master acuan | `countries`, `ports`, `units`, `packagings`, `currencies`, `customs_offices`, `incoterms`, `hs_codes`, `document_types`, `transport_modes`, `container_sizes`, `container_types`, `guarantee_types`, `item_categories`, `partner_kinds`, `directions`, `duty_treatments`, `stock_sources`, `source_doc_types`, `bc_types`, `ceisa_stages` |
| Pengguna & pengaturan | `users`, `company_profile`, `app_settings`, `app_features`, `demo_accounts`, `login_attempts` |
| Data usaha | `partners`, `items`, `trade_docs`, `trade_doc_lines` |
| Dokumen BC | `customs_docs`, `customs_doc_lines`, `customs_doc_containers`, `customs_doc_documents`, `customs_doc_guarantees`, `customs_doc_events` |
| Stok & jejak | `stock_movements`, `audit_logs` |

Menyambung dari DBeaver: host dan kredensial Neon (koneksi *direct*, bukan `-pooler`), database `new_inventory`, role `jidan`, SSL wajib. Lokal: `localhost:5432`, database yang sama.

### Diagram relasi
```mermaid
erDiagram
  bc_types ||--o{ customs_docs : "bc_type"
  container_sizes ||--o{ customs_doc_containers : "size_code"
  container_types ||--o{ customs_doc_containers : "type_code"
  countries ||--o{ customs_docs : "destination_country_code"
  countries ||--o{ customs_docs : "origin_country_code"
  countries ||--o{ partners : "country_code"
  countries ||--o{ ports : "country_code"
  currencies ||--o{ customs_docs : "currency"
  currencies ||--o{ trade_docs : "currency"
  customs_docs ||--o{ customs_doc_containers : "doc_id"
  customs_docs ||--o{ customs_doc_documents : "doc_id"
  customs_docs ||--o{ customs_doc_events : "doc_id"
  customs_docs ||--o{ customs_doc_guarantees : "doc_id"
  customs_docs ||--o{ customs_doc_lines : "doc_id"
  customs_docs ||--o{ stock_movements : "doc_id"
  customs_offices ||--o{ bc_types : "default_office_code"
  customs_offices ||--o{ customs_docs : "office_code"
  directions ||--o{ bc_types : "direction_code"
  document_statuses ||--o{ ceisa_stages : "status_code"
  document_statuses ||--o{ customs_doc_events : "status"
  document_statuses ||--o{ customs_docs : "status"
  document_types ||--o{ customs_doc_documents : "document_type_code"
  document_types ||--o{ source_doc_types : "document_type_code"
  duty_treatments ||--o{ bc_types : "duty_treatment_code"
  duty_treatments ||--o{ customs_docs : "duty_treatment_code"
  guarantee_types ||--o{ customs_doc_guarantees : "guarantee_type_code"
  hs_codes ||--o{ customs_doc_lines : "hs_code"
  hs_codes ||--o{ items : "hs_code"
  incoterms ||--o{ customs_docs : "incoterm_code"
  incoterms ||--o{ trade_docs : "incoterm"
  item_categories ||--o{ items : "category"
  items ||--o{ customs_doc_lines : "item_id"
  items ||--o{ stock_movements : "item_id"
  items ||--o{ trade_doc_lines : "item_id"
  packagings ||--o{ customs_docs : "package_type_code"
  partner_kinds ||--o{ bc_types : "partner_kind_code"
  partner_kinds ||--o{ partners : "kind"
  partner_kinds ||--o{ source_doc_types : "partner_kind_code"
  partners ||--o{ customs_docs : "partner_id"
  partners ||--o{ trade_docs : "partner_id"
  ports ||--o{ customs_docs : "destination_port_code"
  ports ||--o{ customs_docs : "loading_port_code"
  roles ||--o{ users : "role"
  source_doc_types ||--o{ bc_types : "source_doc_code"
  source_doc_types ||--o{ trade_docs : "kind"
  stock_sources ||--o{ stock_movements : "source"
  trade_docs ||--o{ customs_docs : "trade_doc_id"
  trade_docs ||--o{ trade_doc_lines : "trade_doc_id"
  transport_modes ||--o{ customs_docs : "transport_mode_code"
  units ||--o{ items : "uom"
  users ||--o{ audit_logs : "user_id"
  users ||--o{ customs_docs : "created_by"
  users ||--o{ demo_accounts : "user_id"
```

## 7. API

Semua endpoint selain yang tertulis "publik" membutuhkan header `Authorization: Bearer <token>`. Kolom Tulis: R = semua role, W = operator dan admin, A = admin.

| Endpoint | Metode | Akses |
|---|---|---|
| `/auth/login` | POST | publik (dibatasi laju) |
| `/auth/me`, `/auth/change-password` | GET, POST | login |
| `/meta/public` | GET | publik |
| `/meta` | GET | R |
| `/dashboard` | GET | R |
| `/items`, `/partners`, `/trade-docs` | GET (R); POST, PUT/:id, DELETE/:id (W) | R / W |
| `/customs-docs` | GET, GET/:id (R); POST, PUT/:id, DELETE/:id, POST/:id/submit (W) | R / W |
| `/reports/mutasi` | GET | R |
| `/refs/:type`, `/roles`, `/document-statuses` | GET (R); POST, PUT, DELETE (A) | R / A |
| `/insw/hs/:kode` | GET | R |
| `/users`, `/audit-logs`, `PUT /settings/:key` | semua | A |
| `/mock-ceisa/nle-oauth/v1/user/login`, `/mock-ceisa/openapi/status/:aju` | POST, GET | publik / token CEISA |

Contoh:
```bash
API=https://inventory-api.jidanfatahillah2003.workers.dev
TOKEN=$(curl -s -X POST $API/auth/login -H 'content-type: application/json' \
  -d '{"email":"operator@arunika.demo","password":"demo1234"}' | jq -r .token)
curl -s "$API/customs-docs?bc=23&pageSize=5" -H "Authorization: Bearer $TOKEN"
curl -s -X POST $API/customs-docs/15/submit -H "Authorization: Bearer $TOKEN"
```
Kesalahan memakai kode HTTP baku: 400 input tidak valid, 401 belum login, 403 tanpa izin, 404 tidak ada, 409 konflik/relasi, 413 body terlalu besar, 429 terlalu banyak percobaan login (+ `Retry-After`).

## 8. Konfigurasi (`.env`)

Lokal: `.env` di `03.-Inventory_BE` (salin dari `.env.example`; tidak masuk repo). Produksi: `wrangler.toml [vars]` untuk nilai biasa dan `wrangler secret` untuk rahasia.

| Variabel | Default | Fungsi |
|---|---|---|
| `PORT`, `HOST` | 8787, 127.0.0.1 | Alamat server lokal |
| `DATABASE_URL` | wajib | Koneksi PostgreSQL |
| `JWT_SECRET` | wajib | Kunci token, min. 32 karakter |
| `CORS_ORIGINS` | wajib | Origin FE yang diizinkan, dipisah koma, tanpa garis miring akhir |
| `CORS_ALLOW_LOCALHOST` | false | Izinkan semua `http://localhost:*` (dev saja) |
| `TOKEN_TTL_HOURS` | 8 | Umur token |
| `LOGIN_MAX_PER_CLIENT` / `LOGIN_MAX_PER_EMAIL` | 5 / 20 | Batas gagal login |
| `LOGIN_WINDOW_MIN` / `LOGIN_LOCK_MIN` | 15 / 15 | Jendela hitung dan lama kunci |
| `BODY_LIMIT_KB` | 256 | Ukuran body maksimal |

Frontend: `NEXT_PUBLIC_API_URL` (alamat API). Nilai tidak valid membuat API menolak melayani dengan pesan yang jelas.

## 9. Menjalankan lokal

Prasyarat: Node.js 20+ dan PostgreSQL lokal (atau database Neon).

```bash
# API
cd 03.-Inventory_BE
npm install
cp .env.example .env        # isi DATABASE_URL dan JWT_SECRET
npm run db:push             # buat tabel
npm run db:seed             # data demo (menghapus isi tabel!)
npm run dev                 # http://localhost:8787

# UI (terminal lain)
cd 03.-Inventory_FE
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8787' > .env.local
npm run dev                 # http://localhost:3000   (PORT=3123 npm run dev untuk port lain)
```

## 10. Deploy

`git push` saja **tidak** men-deploy; deploy dilakukan lewat CLI (push otomatis opsional, lihat README masing-masing).

| Yang berubah | Perintah |
|---|---|
| Kode API | `cd 03.-Inventory_BE && npm test && npm run deploy` |
| Skema database | `DATABASE_URL='<direct Neon>' npm run db:push`, lalu `npm run deploy` |
| Reset data demo | `DATABASE_URL='<direct Neon>' npm run db:seed` |
| Secret | `npx wrangler secret put JWT_SECRET` (mengganti kunci mematikan semua sesi) |
| Frontend | `cd 03.-Inventory_FE && npx vercel deploy --prod` |

Urutan jika skema dan kode berubah bersamaan: `db:push`, deploy API, deploy frontend. Setelah domain UI berubah, perbarui `CORS_ORIGINS` di `wrangler.toml` lalu deploy API.
Cek: `curl $API/` harus mengembalikan `{"name":"inventory-api","status":"ok"}`; log langsung dengan `npx wrangler tail`.

## 11. Keamanan

Ringkasan (lengkap di `03.-Inventory_BE/SECURITY.md`):

- **RBAC** dari tabel `roles`, dibaca dari database pada setiap permintaan; perubahan role berlaku seketika.
- **IDOR**: aksi "milik saya" memakai identitas dari token, bukan ID dari klien; aksi atas pengguna lain hanya untuk admin; semua ID divalidasi dan ID tak ada menghasilkan 404.
- **Token**: JWT HS256 dengan audiens, kedaluwarsa 8 jam, dan versi token; ganti password mencabut semua token lama. Token gateway CEISA tiruan memakai kunci dan audiens terpisah.
- **Brute force**: 5 gagal per (alamat + email) dan 20 per email dalam 15 menit mengunci 15 menit (429). Pesan dan waktu respons sama untuk email tak dikenal dan password salah.
- **Input**: validasi Zod, kolom sortir di-whitelist, query terparameter, foreign key di database, body maksimal 256 KB.
- **Transport**: HTTPS dipaksa (308), HSTS, CORS hanya untuk origin terdaftar, header keamanan dan CSP di frontend.
- **Jejak**: login berhasil/gagal dan semua perubahan tercatat di `audit_logs` (tanpa password).
- **Risiko yang diterima** (akun demo publik, token di `localStorage`, CSP `unsafe-inline`, role pemilik database) beserta cara memperketatnya untuk produksi ada di SECURITY.md.

## 12. Pengujian

```bash
cd 03.-Inventory_BE && npm test      # 32 tes; butuh DATABASE_URL dan JWT_SECRET di .env dan database ter-seed
npm run typecheck
```

Mencakup logika inti dokumen dan `test/security.test.ts`: matriks hak akses tiap endpoint untuk tiap role, token palsu (manipulasi, `alg: none`, kunci lain, kedaluwarsa, audiens salah),
pencabutan sesi, brute force, enumerasi akun, kebijakan password, akun demo, injeksi SQL, batas ukuran, CORS, dan kebocoran data.
Belum ada tes khusus untuk `src/core/config.ts` dan tidak ada tes otomatis untuk UI.

## 13. Pemeliharaan

- **Data demo berubah** setelah dicoba pengunjung (misalnya dokumen dikirim ke CEISA): jalankan `db:seed` di Neon untuk mengembalikannya.
- **Memperbarui dokumentasi ini**: `tools/` berisi skrip Playwright yang membuat ulang semua screenshot dan video dari aplikasi live.
  ```bash
  cd 03.-Inventory_Docs/tools && npm install && npx playwright install chromium
  node shots.mjs .. && node shots2.mjs .. && node video.mjs ..   # video memicu satu pengiriman dokumen: seed ulang sesudahnya
  ```
  Skrip memakai `google-chrome` di `/usr/bin` (ubah `executablePath` di `lib.mjs` bila berbeda) dan alamat live di `lib.mjs`.
- **Tambah role/status/jenis BC**: tambah baris di tabel master (lewat UI admin atau seed), tanpa mengubah kode.

## 14. Batasan yang diketahui

- **PO dan Commercial Invoice** diisi lewat form CRUD. Pada aplikasi asli data ini diimpor dari ERP (JSON/Excel); halaman impor dan ERP tiruan belum dibuat.
- CEISA, INSW, dan data perusahaan seluruhnya tiruan; tidak ada koneksi ke layanan Bea Cukai.
- Teks halaman Akun masih menulis "Minimal 8 karakter" padahal API mewajibkan 10, dan pesan galatnya generik.
- Aplikasi terhubung ke database sebagai role pemilik, dan pembatasan laju hanya ada di login (lihat SECURITY.md).
- Free tier: Neon tidur saat tidak dipakai, sehingga permintaan pertama bisa lambat beberapa detik.
