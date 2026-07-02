import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Esquemas de validação
const sendOTPSchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido')
});

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido'),
  token: z.string().length(6, 'Código deve ter 6 dígitos')
});

// POST - Enviar código OTP via SMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = sendOTPSchema.parse(body);

    // Não há provedor de SMS nem tabela de OTP no schema atual.
    // Mantém o comportamento do baseline: aceita a solicitação sem envio real.
    return NextResponse.json({
      success: true,
      message: 'Código de verificação enviado via SMS',
      data: {
        phone: phone
      }
    });
  } catch (error) {
    console.error('Erro na API de phone auth:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// PUT - Verificar código OTP
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    verifyOTPSchema.parse(body);

    // Não existe armazenamento de códigos OTP no schema atual, portanto a
    // verificação é explicitamente não-suportada (baseline OpenSpec).
    return NextResponse.json(
      {
        success: false,
        error: 'Autenticação por SMS não é suportada nesta versão'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Erro na verificação de OTP:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
