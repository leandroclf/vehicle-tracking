'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatePasswordSubmitting, setUpdatePasswordSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Inicializar estados com dados do usuário quando disponíveis
  useEffect(() => {
    if (user) {
      // Dividir o nome para tentar obter nome e sobrenome
      const nameParts = user.name?.split(' ') || [''];
      setName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Por enquanto apenas simula o envio de dados
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setIsSubmitting(false);
      }, 1000);
      
      // Aqui seria implementada a chamada real à API
      // const response = await fetch('/api/profile', {...});
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
      setIsSubmitting(false);
    }
  };

  const validatePasswordForm = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!currentPassword) {
      errors.currentPassword = 'A senha atual é obrigatória';
      isValid = false;
    }

    if (!newPassword) {
      errors.newPassword = 'A nova senha é obrigatória';
      isValid = false;
    } else if (newPassword.length < 8) {
      errors.newPassword = 'A nova senha deve ter pelo menos 8 caracteres';
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirme sua nova senha';
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar o formulário antes de enviar
    if (!validatePasswordForm()) {
      return;
    }

    setUpdatePasswordSubmitting(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json() as { 
        success: boolean; 
        error?: string;
        message?: string;
      };

      if (response.ok && data.success) {
        setPasswordMessage({ 
          type: 'success', 
          text: data.message || 'Senha atualizada com sucesso! Use sua nova senha no próximo login.' 
        });
        
        // Limpar os campos de senha após atualização bem-sucedida
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ 
          type: 'error', 
          text: data.error || 'Erro ao atualizar senha' 
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setPasswordMessage({ 
        type: 'error', 
        text: 'Ocorreu um erro ao tentar atualizar a senha'
      });
    } finally {
      setUpdatePasswordSubmitting(false);
    }
  };

  // Mostrar estado de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de não autenticado se necessário
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Você precisa estar autenticado para ver esta página.</p>
        </div>
      </div>
    );
  }

  // Obter iniciais para avatar
  const getInitials = () => {
    if (!user?.name) return '--';
    
    const nameParts = user.name.split(' ').filter(Boolean);
    if (nameParts.length === 0) return '--';
    
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Perfil do Usuário</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Informações do perfil */}
          <div className="md:w-1/3 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl text-blue-600 dark:text-blue-400 font-bold">{getInitials()}</span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{user?.name || 'Usuário'}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Usuário</p>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Alterar Foto
              </button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Informações de Contato</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{user?.email || 'Sem email cadastrado'}</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{user?.phone || 'Sem telefone cadastrado'}</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Último acesso: 15/06/2023 às 14:30</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:w-2/3 p-6">
            {message.text && (
              <div className={`mb-4 p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome
                    </label>
                    <input 
                      type="text" 
                      id="firstName"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sobrenome
                    </label>
                    <input 
                      type="text" 
                      id="lastName"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input 
                      type="email" 
                      id="email"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone
                    </label>
                    <input 
                      type="tel" 
                      id="phone"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
            
            <hr className="my-8 border-gray-200 dark:border-gray-700" />
            
            {/* Seção de alteração de senha */}
            <form onSubmit={handlePasswordUpdate}>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Alterar Senha</h3>
                
                {passwordMessage.text && (
                  <div className={`mb-4 p-3 rounded-md ${
                    passwordMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Senha Atual
                    </label>
                    <Input 
                      type="password" 
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      error={passwordErrors.currentPassword}
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nova Senha
                    </label>
                    <Input 
                      type="password" 
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={passwordErrors.newPassword}
                      helperText="Mínimo de 8 caracteres"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <Input 
                      type="password" 
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={passwordErrors.confirmPassword}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={updatePasswordSubmitting}
                  disabled={updatePasswordSubmitting}
                >
                  {updatePasswordSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
            </form>
            
            <hr className="my-8 border-gray-200 dark:border-gray-700" />
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Preferências</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="emailNotifications"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Receber notificações por email
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="smsNotifications"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                  />
                  <label htmlFor="smsNotifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Receber notificações por SMS
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 