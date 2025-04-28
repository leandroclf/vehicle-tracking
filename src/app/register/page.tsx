'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await register(name, email, phone, password);
      if (result.success) {
        // Redirecionar para a página de login com mensagem de sucesso
        router.push('/login?registered=true');
      } else {
        setError(result.error || 'Erro ao registrar');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar registrar');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md border-t-4 border-t-[#00315c] p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#00315c]">Yukz</h1>
          <p className="text-gray-700 mt-2">Crie sua conta</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007db8] focus:border-transparent"
              placeholder="Seu nome completo"
              required
            />
          </div>
          
          <div>
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
          
          <div>
            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007db8] focus:border-transparent"
              placeholder="(00) 00000-0000"
            />
          </div>
          
          <div>
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
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-[#007db8] hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 