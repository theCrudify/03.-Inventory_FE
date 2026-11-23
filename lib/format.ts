const nf = (d = 0) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
export const num = (v: number | string | null | undefined, d = 0) => nf(d).format(Number(v ?? 0));
export const qty = (v: number | string | null | undefined) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(Number(v ?? 0));
export const idr = (v: number | string | null | undefined) => 'Rp ' + nf().format(Math.round(Number(v ?? 0)));
export const money = (v: number | string | null | undefined, cur: string) => `${cur} ${nf(2).format(Number(v ?? 0))}`;
export const date = (v?: string | Date | null) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const dateTime = (v?: string | Date | null) => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
/** 00002312034520261123000001 -> 000023-120345-20261123-000001 */
export const aju = (v: string) => v.replace(/^(\d{6})(\d{6})(\d{8})(\d{6})$/, '$1-$2-$3-$4');
/** Local (not UTC) YYYY-MM-DD; toISOString would shift dates back a day in WIB. */
export const isoDate = (d: Date = new Date()) => d.toLocaleDateString('sv-SE');
export const today = () => isoDate();
