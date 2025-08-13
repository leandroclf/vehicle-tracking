import { MockDatabase } from '../database-mock';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersQuery {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  limit: number;
  offset: number;
}

class UsersServiceMock {
  async getUsers(query: UsersQuery = {}): Promise<UsersResponse> {
    const { limit = 20, offset = 0, search = '', role = '' } = query;
    
    // Simular busca de usuários do MockDatabase
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@yukz.com',
        name: 'Administrador',
        role: 'admin',
        phone: '+55 65 99999-9999',
        avatarUrl: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        email: 'user@yukz.com',
        name: 'Usuário Teste',
        role: 'user',
        phone: '+55 65 88888-8888',
        avatarUrl: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        email: 'manager@yukz.com',
        name: 'Gerente',
        role: 'manager',
        phone: '+55 65 77777-7777',
        avatarUrl: null,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ];

    // Filtrar por busca
    let filteredUsers = mockUsers;
    if (search) {
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtrar por role
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Aplicar paginação
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      data: paginatedUsers,
      total,
      limit,
      offset,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await MockDatabase.findUserById(id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser = await MockDatabase.createUser({
      email: userData.email,
      name: userData.name,
      passwordHash: '', // Será definido pelo AuthService
      emailVerified: false,
      role: userData.role,
      phone: userData.phone,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      avatarUrl: null,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const updatedUser = await MockDatabase.updateUser(id, {
      name: updates.name,
      role: updates.role,
      phone: updates.phone,
    });

    if (!updatedUser) {
      return null;
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatarUrl: null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    // Simular exclusão (não implementado no MockDatabase)
    console.log(`Mock: Usuário ${id} excluído`);
    return true;
  }
}

export const UsersService = new UsersServiceMock();