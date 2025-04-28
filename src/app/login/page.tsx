import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card border-t-[#00315c] p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#00315c]">Yukz</h1>
          <p className="text-gray-600 mt-2">Acesse sua conta</p>
        </div>
        
        <form>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="input-field"
              placeholder="seu@email.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              id="password"
              className="input-field"
              placeholder="********"
            />
            <div className="mt-2 text-right">
              <a href="#" className="text-sm text-[#007db8] hover:underline">Esqueceu a senha?</a>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
          >
            Entrar
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">Não tem uma conta? 
              <Link href="/register" className="text-[#007db8] hover:underline ml-1">Registre-se</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}