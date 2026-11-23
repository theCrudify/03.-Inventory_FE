'use client';
import type { Paged } from './api';
import type { Item, Partner } from './types';
import { useFetch } from './use-fetch';

// Small reference lists come from useMeta(); these two are full tables, fetched on demand.
export function usePartners(kind?: string) {
  const { data } = useFetch<Paged<Partner>>(`/partners?pageSize=100${kind ? `&kind=${kind}` : ''}`);
  return data?.data ?? [];
}
export function useItems() {
  const { data } = useFetch<Paged<Item>>('/items?pageSize=100');
  return data?.data ?? [];
}
