'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { SocialAuthError } from '@/types/social-auth';

function RegisterForm() {
  const router = useRouter();
  const { signUp, socialLogin } = useAuth();
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
      await signUp(email, password, name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro ao tentar registrar');
      console.error('Erro ao registrar usuário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Simulação de tokens para demonstração
      // Em produção, estes seriam obtidos do SDK do provedor
      const accessToken = 'demo-access-token';
      const idToken = provider === 'apple' || provider === 'google' ? 'demo-id-token' : undefined;
      
      await socialLogin(provider, accessToken, idToken);
      router.push('/dashboard');
    } catch (err: any) {
      const socialError = err as SocialAuthError;
      setError(socialError.message || 'Erro ao realizar registro social');
      console.error('Erro de registro social:', socialError);
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
            <p className="text-gray-700 dark:text-gray-300 mt-2">Novo Usuário</p>
          </div>
          
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome
              </label>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            
            <div>
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
            
            <div>
              <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Telefone
              </label>
              <Input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            
            <div>
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
            </div>
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Criar Conta'}
            </Button>
            
            {/* Botões de registro social */}
            <div className="mt-4">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">Ou registre-se com</p>
              <SocialLoginButtons onSocialLogin={handleSocialSignup} isLoading={isLoading} />
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#007db8] dark:text-blue-400 hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}