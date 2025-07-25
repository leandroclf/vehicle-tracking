'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Send, Check } from 'lucide-react';

export default function PhoneAuthTest() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendOTP = async () => {
    if (!phone) {
      setError('Digite um número de telefone');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setStep('verify');
      } else {
        setError(data.error || 'Erro ao enviar código');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError('Digite o código de verificação');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: otp })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        console.log('Dados do usuário:', data.data);
      } else {
        setError(data.error || 'Código inválido');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setPhone('');
    setOtp('');
    setStep('phone');
    setMessage('');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Teste de Autenticação por Telefone
          </CardTitle>
          <CardDescription>
            Teste a funcionalidade de login via SMS OTP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número do Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+5511999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use o formato internacional: +5511999999999
                </p>
              </div>
              
              <Button 
                onClick={sendOTP}
                disabled={!phone || loading}
                className="w-full"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Código SMS
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Código de Verificação</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Digite o código de 6 dígitos enviado para {phone}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={verifyOTP}
                  disabled={!otp || loading}
                  className="flex-1"
                >
                  {loading ? (
                    'Verificando...'
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Verificar
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={resetTest}
                  disabled={loading}
                >
                  Voltar
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={sendOTP}
                disabled={loading}
                className="w-full text-sm"
              >
                Reenviar código
              </Button>
            </div>
          )}

          <div className="mt-6 p-3 bg-muted rounded text-sm">
            <h4 className="font-medium mb-2">Status do Teste:</h4>
            <ul className="space-y-1 text-xs">
              <li>📱 Endpoint SMS: /api/auth/phone</li>
              <li>🔧 Supabase Auth OTP</li>
              <li>📋 Validação com Zod</li>
              <li>👤 Criação automática de perfil</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}