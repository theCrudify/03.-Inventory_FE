# 03.-Inventory_FE

Frontend **Arunika IT Inventory**, prototype IT Inventory Kawasan Berikat (portofolio).
Perusahaan, mitra, dan transaksinya fiktif. Respon Bea Cukai (CEISA) disimulasikan oleh `03.-Inventory_BE`.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · lucide-react

**Live:** https://inventory-ui-rho-ten.vercel.app (API: https://inventory-api.jidanfatahillah2003.workers.dev)

## Fitur

- Login dengan 3 role (admin, operator, viewer read-only) dan audit log
- Dashboard: KPI dokumen, grafik nilai pabean 6 bulan, respon CEISA terbaru
- Sumber dokumen: Purchase Order dan Commercial Invoice
- 9 jenis dokumen BC (2.3, 2.5, 2.6.1, 2.6.2, 2.7 masuk/keluar, 3.0, 4.0, 4.1): buat dari PO/invoice,
  kirim ke CEISA, pantau status secara live (stepper + payload respon), perhitungan pungutan, cetak/PDF
- Laporan mutasi per kategori barang (ekspor XLSX)
- Master data: barang (dengan saldo), mitra, referensi dan tarif (HS, kurs, pelabuhan, dll.)

## Data-driven

Semua label, pilihan dropdown, menu jenis BC, laporan per kategori, aturan form (field impor/ekspor, jaminan,
kantor default), tarif untuk estimasi pungutan, profil perusahaan, dan branding diambil dari `GET /meta`
(master database) melalui `lib/meta.tsx`. Tidak ada data bisnis yang ditulis langsung di kode UI.

## Menjalankan lokal

```bash
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:8787' > .env.local   # API harus jalan (lihat 03.-Inventory_BE)
npm run dev        # http://localhost:3000
```

## Deploy (Vercel)

**Penting:** `git push` saja tidak men-deploy sampai repo dihubungkan ke Vercel (opsi B). Deploy yang berjalan sekarang memakai CLI.

Variabel yang dibutuhkan: `NEXT_PUBLIC_API_URL` (alamat API, tanpa garis miring akhir). Nilainya ikut tertanam saat build,
jadi mengubahnya berarti deploy ulang. API hanya menerima origin yang terdaftar di `CORS_ORIGINS` (`wrangler.toml` di folder API).

### A. CLI (dipakai sekarang)
```bash
npx vercel login                              # sekali saja
npx vercel link                               # sekali saja, pilih/buat project
npx vercel env add NEXT_PUBLIC_API_URL production   # sekali saja, isi URL Worker
npx vercel deploy --prod                      # setiap kali ingin merilis
```
`npx vercel deploy` tanpa `--prod` membuat preview. Preview berada di domain lain, jadi API akan menolaknya (CORS)
kecuali domainnya ditambahkan ke `CORS_ORIGINS`.

### B. Otomatis lewat push
1. Push folder ini ke GitHub.
2. [vercel.com](https://vercel.com), **Add New, Project**, import repo, tambahkan `NEXT_PUBLIC_API_URL`.
3. Setelahnya, push ke `main` men-deploy ke produksi, dan branch lain menjadi preview.

### Setelah domain berubah
Masukkan URL Vercel ke `CORS_ORIGINS` di `wrangler.toml` API, lalu `npm run deploy` di folder API.

### Urutan jika backend dan frontend berubah bersamaan
1. API: `db:push` (jika skema berubah), lalu `npm run deploy`.
2. Frontend: `npx vercel deploy --prod`.
