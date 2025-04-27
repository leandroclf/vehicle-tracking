export default function LoginPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border rounded"
              placeholder="seu@email.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium">
              Senha
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border rounded"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
} 