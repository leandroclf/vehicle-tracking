'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Shield, Smartphone, Mail, Key, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { MFAStatus } from '@/types/mfa';

export default function MFASettings() {
  const { user } = useAuth();
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  
  // Estados para formulários
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [activeProvider, setActiveProvider] = useState<'sms' | 'totp' | 'email' | null>(null);

  useEffect(() => {
    if (user) {
      loadMFAStatus();
    }
  }, [user]);

  const loadMFAStatus = async () => {
    try {
      const response = await fetch('/api/mfa');
      const data = await response.json();
      
      if (data.success) {
        setMfaStatus(data.data);
      } else {
        setError('Erro ao carregar status MFA');
      }
    } catch (error) {
      setError('Erro ao carregar configurações MFA');
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async (provider: 'sms' | 'totp' | 'email') => {
    setSetupLoading(true);
    setError('');
    setMessage('');

    try {
      const payload: any = { provider };
      
      if (provider === 'sms') payload.phone = phoneNumber;
      if (provider === 'email') payload.email = emailAddress;

      const response = await fetch('/api/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.data.message);
        setActiveProvider(provider);
        
        if (data.data.qrCode) {
          setQrCode(data.data.qrCode);
        }
        
        if (data.data.backupCodes) {
          setBackupCodes(data.data.backupCodes);
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao configurar MFA');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyMFA = async () => {
    setVerifyLoading(true);
    setError('');

    try {
      const response = await fetch('/api/mfa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProvider,
          code: verificationCode,
          sessionToken
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('MFA configurado com sucesso!');
        setActiveProvider(null);
        setVerificationCode('');
        setQrCode('');
        loadMFAStatus(); // Recarregar status
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao verificar código');
    } finally {
      setVerifyLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!confirm('Tem certeza que deseja desabilitar a autenticação multifatorial?')) {
      return;
    }

    try {
      const response = await fetch('/api/mfa', {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('MFA desabilitado com sucesso');
        loadMFAStatus();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Erro ao desabilitar MFA');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação Multifatorial (MFA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Status MFA</h3>
                <p className="text-sm text-muted-foreground">
                  {mfaStatus?.enabled ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <Badge variant={mfaStatus?.enabled ? 'default' : 'secondary'}>
                {mfaStatus?.enabled ? 'Habilitado' : 'Desabilitado'}
              </Badge>
            </div>

            {!mfaStatus?.enabled ? (
              <Tabs defaultValue="sms" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="totp">Authenticator</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>

                <TabsContent value="sms" className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4" />
                    <h4 className="font-medium">SMS</h4>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número do Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+55 11 99999-9999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => setupMFA('sms')}
                    disabled={!phoneNumber || setupLoading}
                  >
                    {setupLoading ? 'Configurando...' : 'Configurar SMS'}
                  </Button>
                </TabsContent>

                <TabsContent value="totp" className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4" />
                    <h4 className="font-medium">Google Authenticator</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use um aplicativo como Google Authenticator ou Authy
                  </p>
                  <Button 
                    onClick={() => setupMFA('totp')}
                    disabled={setupLoading}
                  >
                    {setupLoading ? 'Configurando...' : 'Configurar Authenticator'}
                  </Button>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    <h4 className="font-medium">Email</h4>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Endereço de Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => setupMFA('email')}
                    disabled={!emailAddress || setupLoading}
                  >
                    {setupLoading ? 'Configurando...' : 'Configurar Email'}
                  </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {mfaStatus.providers.sms.enabled && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>SMS: {mfaStatus.providers.sms.phone}</span>
                      </div>
                      <Badge>Ativo</Badge>
                    </div>
                  )}
                  
                  {mfaStatus.providers.totp.enabled && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span>Authenticator App</span>
                      </div>
                      <Badge>Ativo</Badge>
                    </div>
                  )}
                  
                  {mfaStatus.providers.email.enabled && (
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email: {mfaStatus.providers.email.email}</span>
                      </div>
                      <Badge>Ativo</Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Códigos de Backup</p>
                    <p className="text-sm text-muted-foreground">
                      {mfaStatus.backupCodes.count} códigos restantes
                    </p>
                  </div>
                </div>

                <Button variant="destructive" onClick={disableMFA}>
                  Desabilitar MFA
                </Button>
              </div>
            )}

            {/* Modal de verificação */}
            {activeProvider && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Verificar Configuração</CardTitle>
                  <CardDescription>
                    {activeProvider === 'totp' && qrCode && (
                      <div className="space-y-4">
                        <p>Escaneie o QR Code com seu aplicativo authenticator:</p>
                        <img src={qrCode} alt="QR Code" className="mx-auto" />
                      </div>
                    )}
                    {activeProvider !== 'totp' && (
                      <p>Digite o código de verificação enviado</p>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification">Código de Verificação</Label>
                    <Input
                      id="verification"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                  </div>
                  
                  {backupCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Códigos de Backup</Label>
                      <div className="p-3 bg-muted rounded text-sm font-mono">
                        {backupCodes.map((code, index) => (
                          <div key={index}>{code}</div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyBackupCodes}
                        className="w-full"
                      >
                        {copiedCodes ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Códigos
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Guarde estes códigos em local seguro. Eles podem ser usados para acessar sua conta se você perder acesso ao seu dispositivo MFA.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={verifyMFA}
                      disabled={!verificationCode || verifyLoading}
                    >
                      {verifyLoading ? 'Verificando...' : 'Verificar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveProvider(null);
                        setVerificationCode('');
                        setQrCode('');
                        setBackupCodes([]);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}