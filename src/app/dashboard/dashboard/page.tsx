export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Veículos Ativos</h2>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Alertas Recentes</h2>
          <p className="text-3xl font-bold">3</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Geocercas</h2>
          <p className="text-3xl font-bold">5</p>
        </div>
      </div>
    </div>
  );
} 