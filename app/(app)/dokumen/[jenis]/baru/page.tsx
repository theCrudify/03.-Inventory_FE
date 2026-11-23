'use client';
import { notFound, useParams } from 'next/navigation';
import { DocForm } from '@/components/doc-form';
import { useMeta } from '@/lib/meta';

export default function NewDocPage() {
  const bc = useMeta().bcBySlug(useParams<{ jenis: string }>().jenis);
  if (!bc) notFound();
  return <DocForm bc={bc} />;
}
