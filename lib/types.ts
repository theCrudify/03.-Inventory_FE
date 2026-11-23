import type { BcType } from './meta';

/** `role` is a refs code; permissions come from the role's master flags (resolved at login). */
export type User = { id: number; name: string; email: string; role: string; canWrite?: boolean; isAdmin?: boolean; createdAt?: string };
export type Item = { id: number; code: string; name: string; category: string; hsCode: string | null; uom: string; stock?: number };
export type Partner = { id: number; kind: string; name: string; npwp: string | null; address: string | null; countryCode: string };
export type TradeLine = { itemId: number; qty: number; unitPrice: number };
export type TradeDoc = { id: number; kind: string; number: string; date: string; partnerId: number; partnerName?: string; currency: string; incoterm: string | null; lines: TradeLine[]; amount?: string; total?: string };
export type DocStatus = string; // document_statuses.code
export type Duties = { bm: number; ppn: number; pph: number; total: number; treatment: string };
export type CustomsListRow = {
  id: number; bcType: string; ajuNumber: string; registrationNumber: string | null; registrationDate: string | null;
  status: DocStatus; partnerId: number; partnerName: string; officeCode: string; currency: string; kurs: string;
  totalValue: string; submittedAt: string | null; createdAt: string;
};
export type CustomsLine = { id: number; itemId: number; itemCode: string; itemName: string; uom: string; hsCode: string | null; qty: string; unitPrice: string; bmRate: string; ppnRate: string; pphRate: string };
export type CeisaEvent = { id: number; status: DocStatus; code: string; message: string; payload: Record<string, unknown> | null; createdAt: string };
export type CustomsDoc = Omit<CustomsListRow, 'partnerName'> & {
  tradeDocId: number | null; header: Header; duties: Duties | null; partner: Partner; lines: CustomsLine[]; events: CeisaEvent[];
  type: BcType;
};
export type Header = {
  caraAngkut?: string; pengangkut?: string; nomorVoyage?: string; nomorPolisi?: string; pelabuhanMuat?: string; pelabuhanTujuan?: string;
  negaraAsal?: string; negaraTujuan?: string; incoterm?: string; tujuanPengiriman?: string;
  kemasan?: { jumlah?: number; jenis?: string }; bruto?: number; netto?: number;
  kontainer?: { nomor: string; ukuran: string; tipe: string }[];
  dokumen?: { jenis: string; nomor: string; tanggal: string }[];
  jaminan?: { jenis?: string; nomor?: string; penjamin?: string; nilai?: number; jatuhTempo?: string };
};
