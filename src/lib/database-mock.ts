import bcrypt from 'bcryptjs';

// Mock database em memória para testes
interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  phone?: string;
  role?: string;
}

class MockDatabaseClass {
  private users: MockUser[] = [
    {
      id: '1',
      email: 'admin@yukz.com',
      name: 'Administrador',
      passwordHash: '$2b$12$Us6wc7aOTLOsrrfzqMO5DuLmwyBwNY.pyTPlZi9GqWdw1PU6dJFk6', // senha: admin123
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'admin',
    },
  ];

  private nextId = 2;

  async findUserByEmail(email: string): Promise<MockUser | null> {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  async findUserById(id: string): Promise<MockUser | null> {
    const user = this.users.find(u => u.id === id);
    return user || null;
  }

  async createUser(userData: Omit<MockUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockUser> {
    const newUser: MockUser = {
      ...userData,
      id: this.nextId.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    this.nextId++;
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<MockUser, 'id' | 'createdAt'>>): Promise<MockUser | null> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return this.users[userIndex];
  }

  async checkHealth() {
    return true;
  }

  // Simular função transaction
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    // Mock simples - apenas executa o callback
    return await callback(this);
  }

  // Simular função select
  select() {
    return {
      from: (table: any) => ({
        where: (condition: any) => ({
          limit: (num: number) => this.users.slice(0, num),
        }),
      }),
    };
  }
}

export const MockDatabase = new MockDatabaseClass();

// Funções utilitárias para compatibilidade
export async function getConnection() {
  return {
    query: async (sql: string, params?: any[]) => {
      console.log('Mock query:', sql, params);
      return { rows: [] };
    },
    release: () => {}
  };
}

export async function checkDatabaseHealth(): Promise<boolean> {
  return MockDatabase.checkHealth();
}

export async function ensureDatabaseStructure(): Promise<void> {
  console.log('Mock: Database structure ensured');
}

export async function withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  return callback(mockDb);
}

// Funções de cache mock
export async function getFromCache(key: string): Promise<any> {
  return null;
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  // Mock implementation
}

export async function deleteFromCache(key: string): Promise<void> {
  // Mock implementation
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Mock implementation
}

export async function notifyChange(table: string, operation: string, data: any, userId?: string) {
  console.log('Mock notification:', { table, operation, data, userId });
}

// Exportar o banco mock como db para compatibilidade
export const db = new MockDatabaseClass();
export { redis } from './database';