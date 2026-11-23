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
- Laporan mutasi per kategori barang (ekspor CSV)
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

## Deploy gratis (Vercel)

1. Push folder ini ke GitHub, lalu di [vercel.com](https://vercel.com) pilih **Add New → Project** dan import repo-nya.
2. Isi environment variable `NEXT_PUBLIC_API_URL` = URL Workers API (`https://inventory-api.jidanfatahillah2003.workers.dev`).
3. Deploy. Setelah itu masukkan URL Vercel ke `CORS_ORIGINS` di `wrangler.toml` API, lalu jalankan `npm run deploy` ulang di folder API.
