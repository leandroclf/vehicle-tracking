'use client';

import React, { useEffect, useState } from 'react';
import AdminRoute from '@/components/auth/AdminRoute';

interface User {
  id: string;
  name: string;
  email: string;
  role_id: string;
  roles: { name: string }[] | { name: string };
}

interface Role {
  id: string;
  name: string;
}

// Esqueleto inicial da página administrativa de usuários/perfis
const UsersAdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch('/api/users').then(r => r.json()),
          fetch('/api/roles').then(r => r.json()),
        ]);
        if ((usersRes as any).error) throw new Error((usersRes as any).error);
        if ((rolesRes as any).error) throw new Error((rolesRes as any).error);
        setUsers(usersRes as User[]);
        setRoles(rolesRes as Role[]);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setUpdating(userId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: newRoleId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar perfil');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: newRoleId } : u));
      setSuccess('Perfil atualizado com sucesso');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Administração de Usuários</h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow">
          {loading && <p>Carregando...</p>}
          {error && <div className="bg-red-700 text-white p-2 mb-4 rounded">{error}</div>}
          {success && <div className="bg-green-700 text-white p-2 mb-4 rounded">{success}</div>}
          {!loading && users.length === 0 && <p>Nenhum usuário encontrado.</p>}
          {!loading && users.length > 0 && (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-300">
                  <th className="py-2 px-4">Nome</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Perfil</th>
                  <th className="py-2 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-700">
                    <td className="py-2 px-4">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">
                      <select
                        className="bg-gray-900 text-white rounded px-2 py-1"
                        value={user.role_id}
                        disabled={updating === user.id}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      {updating === user.id && <span className="text-blue-400">Atualizando...</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminRoute>
  );
};

export default UsersAdminPage;