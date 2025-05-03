'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

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
      
      // Adicionar delay para garantir que logs anteriores sejam exibidos
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Tentar fazer login
      const result = await login(email, password);
      console.log('Resultado do login:', result);
      
      if (result.success) {
        console.log('Login bem-sucedido, redirecionando para dashboard');
        // Adicionar pequeno delay para garantir que o token seja armazenado
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/dashboard');
      } else {
        console.error('Falha no login:', result.error);
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Exceção durante login:', err);
      setError('Ocorreu um erro ao tentar fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Container className="max-w-md">
        <Card className="border-t-4 border-t-[#00315c]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#00315c]">Yukz</h1>
            <p className="text-gray-700 mt-2">Acesse sua conta</p>
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
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
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
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
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
                <Link href="/forgot-password" className="text-sm text-[#007db8] hover:underline">
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
              <p className="text-gray-700">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-[#007db8] hover:underline">
                  Registre-se
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
}