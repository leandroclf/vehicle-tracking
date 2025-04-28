'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o usuário acabou de se registrar
  useEffect(() => {
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccess('Registro realizado com sucesso! Faça login para continuar.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      console.log('Tentando login com:', { email });
      const result = await login(email, password);
      console.log('Resultado do login:', result);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login');
      console.error('Erro durante login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md border-t-4 border-t-[#00315c] p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#00315c]">Yukz</h1>
          <p className="text-gray-700 mt-2">Acesse sua conta</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007db8] focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007db8] focus:border-transparent"
              placeholder="********"
              required
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-[#007db8] hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md transition-colors font-medium shadow-sm ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#00315c] hover:bg-[#002342] text-white'
            }`}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-[#007db8] hover:underline">
                Registre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}