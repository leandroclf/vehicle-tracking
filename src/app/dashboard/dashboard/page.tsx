import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Grid from '@/components/ui/Grid';
import Stats from '@/components/ui/Stats';
import { Truck, Bell, MapPin } from 'lucide-react';

export default function DashboardPage() {
  const statsItems = [
    {
      id: "vehicles",
      label: "Veículos Ativos",
      value: "12",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "alerts",
      label: "Alertas Recentes",
      value: "3",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "geofences",
      label: "Geocercas",
      value: "5",
      icon: <MapPin className="w-5 h-5" />,
    }
  ];

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Stats 
        items={statsItems}
        columns={3}
        className="gap-4"
      />
    </Container>
  );
} 