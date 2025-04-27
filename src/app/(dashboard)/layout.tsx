import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

interface DashboardLayoutProps {
  children: any;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 