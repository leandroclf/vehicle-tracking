import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { mfaService } from '@/lib/auth/mfa-service';
import { z } from 'zod';

// Schema para setup MFA
const setupMFASchema = z.object({
  provider: z.enum(['sms', 'totp', 'email']),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

// Schema para verificação MFA
const verifyMFASchema = z.object({
  provider: z.enum(['sms', 'totp', 'email', 'backup']),
  code: z.string().min(4, 'Código deve ter pelo menos 4 caracteres'),
  sessionToken: z.string().uuid('Token de sessão inválido')
});

/**
 * GET /api/mfa - Obter status MFA do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const status = await mfaService.getMFAStatus(user.id);
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Erro ao obter status MFA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mfa - Configurar MFA
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = setupMFASchema.parse(body);

    // Validações específicas por provedor
    if (validatedData.provider === 'sms' && !validatedData.phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório para MFA via SMS' },
        { status: 400 }
      );
    }

    if (validatedData.provider === 'email' && !validatedData.email) {
      return NextResponse.json(
        { error: 'Email é obrigatório para MFA via email' },
        { status: 400 }
      );
    }

    const result = await mfaService.setupMFA(user.id, validatedData);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao configurar MFA:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mfa - Verificar código MFA
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyMFASchema.parse(body);

    const result = await mfaService.verifyMFA(validatedData);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao verificar MFA:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Código inválido ou expirado' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/mfa - Desabilitar MFA
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    const user = authResult.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se MFA é obrigatório para este usuário
    const profileResponse = await fetch(`${process.env.API_BASE_URL}/api/profiles/${user.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      throw new Error('Erro ao buscar perfil do usuário');
    }

    const profile = (await profileResponse.json()) as { role?: string } | null;

    if (profile?.role === 'admin') {
      return NextResponse.json(
        { error: 'MFA é obrigatório para administradores' },
        { status: 403 }
      );
    }

    // Desabilitar MFA
    const disableResponse = await fetch(`${process.env.API_BASE_URL}/api/mfa/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: user.id })
    });

    if (!disableResponse.ok) {
      throw new Error('Erro ao desabilitar MFA');
    }

    return NextResponse.json({
      success: true,
      message: 'MFA desabilitado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desabilitar MFA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}