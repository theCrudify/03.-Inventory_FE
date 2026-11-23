'use client';
import { notFound, useParams } from 'next/navigation';
import { DocForm } from '@/components/doc-form';
import { ErrorBox, FormSkeleton } from '@/components/ui';
import { useMeta } from '@/lib/meta';
import { usePrefs } from '@/lib/prefs';
import type { CustomsDoc } from '@/lib/types';
import { useFetch } from '@/lib/use-fetch';

export default function EditDocPage() {
  const { jenis, id } = useParams<{ jenis: string; id: string }>();
  const meta = useMeta();
  const { t } = usePrefs();
  const bc = meta.bcBySlug(jenis);
  if (!bc) notFound();
  const { data, error } = useFetch<CustomsDoc>(`/customs-docs/${id}`);
  if (error) return <ErrorBox text={error} />;
  if (!data) return <FormSkeleton />;
  if (!meta.status(data.status).editable) return <ErrorBox text={t('doc.cannotEditSubmitted')} />;
  return <DocForm bc={bc} existing={data} />;
}
