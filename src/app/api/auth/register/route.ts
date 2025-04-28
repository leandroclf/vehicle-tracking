import { NextRequest, NextResponse } from 'next/server';

interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterRequest;
    const { name, email, phone, password } = body;

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    // TODO: Implementar cadastro real com banco de dados
    // Por agora, apenas simulamos um registro bem-sucedido

    // Simulação de validação de email já existente
    if (email === 'demo@yukz.com' || email === 'teste@yukz.com') {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
    }

    // Simular atraso da rede para dar feedback visual
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: 'Usuário registrado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 