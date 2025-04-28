import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/jwt';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest;
    const { email, password } = body;

    // Validação básica
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    // TODO: Implementar validação real com banco de dados
    // Por agora, apenas aceitamos os usuários de teste
    const mockUsers = [
      {
        id: '1',
        email: 'demo@yukz.com',
        name: 'Usuário Demo',
        password: 'demo123',
        phone: '11999999999'
      },
      {
        id: '2',
        email: 'teste@yukz.com',
        name: 'Usuário Teste',
        password: 'senha123',
        phone: '11988888888'
      }
    ];

    const user = mockUsers.find(u => u.email === email);

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gerar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Remover senha antes de retornar
    const { password: _, ...userWithoutPassword } = user;
    
    // Log para depuração
    console.log('Login bem-sucedido para:', email);
    console.log('Dados do usuário retornados:', { user: userWithoutPassword, tokenLength: token.length });

    return NextResponse.json({
      user: userWithoutPassword,
      token
    }, { status: 200 });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}