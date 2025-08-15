'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';

// Componente de reCAPTCHA simulado
function RecaptchaSimulator() {
  return (
    <div className="mb-4 border border-gray-300 rounded-md p-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-5 h-5 border border-gray-400 rounded mr-2"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Não sou um robô</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 dark:text-gray-400">reCAPTCHA</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Privacidade - Termos</div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Simular verificação do reCAPTCHA
      setCaptchaVerified(true);
      
      // Esta é uma simulação. Em um ambiente real, chamaria a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Em produção, conecte isso à função real de recuperação de senha
      console.log('Enviando solicitação de redefinição para:', email);
      
      // Simular sucesso
      setSuccess(`Um link de recuperação foi enviado para ${email}. Verifique sua caixa de entrada.`);
      setEmail(''); // Limpar o campo após o sucesso
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      setError('Ocorreu um erro ao processar sua solicitação. Tente novamente.');
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
            <p className="text-gray-700 dark:text-gray-300 mt-2">Recuperação de Senha</p>
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
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enviaremos um link para redefinir sua senha para o email informado.
              </p>
            </div>
            
            {/* Simulador de reCAPTCHA */}
            <RecaptchaSimulator />
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Recuperar Senha'}
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Lembrou sua senha?{' '}
                <Link href="/login" className="text-[#007db8] dark:text-blue-400 hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
} 