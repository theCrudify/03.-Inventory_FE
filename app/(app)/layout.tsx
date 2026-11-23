import { Shell } from '@/components/shell';
import { MetaProvider } from '@/lib/meta';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MetaProvider><Shell>{children}</Shell></MetaProvider>;
}
