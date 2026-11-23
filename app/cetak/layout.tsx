import { MetaProvider } from '@/lib/meta';

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <MetaProvider>{children}</MetaProvider>;
}
