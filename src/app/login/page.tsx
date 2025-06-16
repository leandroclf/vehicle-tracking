'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';

function LoginForm() {
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
    const registered = searchParams?.get('registered');
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
      await login(email, password);
      // Pequeno delay para garantir atualização de estado
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro ao tentar fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Container className="max-w-md">
        <Card className="border-t-4 border-t-[#00315c] dark:bg-gray-800">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#00315c] dark:text-blue-400">Yukz</h1>
            <p className="text-gray-700 dark:text-gray-300 mt-2">Acesse sua conta</p>
          </div>
          
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-4">
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
              <div className="mt-2 text-right">
                <Link href="/forgot-password" className="text-sm text-[#007db8] dark:text-blue-400 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-[#007db8] dark:text-blue-400 hover:underline">
                  Novo Usuário
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}