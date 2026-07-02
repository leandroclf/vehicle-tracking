// Ambiente da suíte de integração — precisa rodar antes de qualquer import
// dos módulos da aplicação (o pool de conexões é criado no import).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres123@localhost:5432/vehicle_tracking';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'integration-test-secret-key-with-32-chars!';
process.env.NODE_ENV = 'test';
