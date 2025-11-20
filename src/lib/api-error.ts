import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message, details: error.details },
            { status: error.statusCode }
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            { error: 'Dados inválidos', details: error.format() },
            { status: 400 }
        );
    }

    if (error instanceof Error) {
        // Tratamento para erros do PostgreSQL/Drizzle
        // @ts-ignore - Erros do driver pg podem ter código
        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'Conflito de dados: registro já existe (duplicado)' },
                { status: 409 }
            );
        }
        // @ts-ignore
        if (error.code === '23503') {
            return NextResponse.json(
                { error: 'Violação de integridade referencial (chave estrangeira inválida)' },
                { status: 400 }
            );
        }

        // Tratamento específico para erros comuns de serviço (fallback por mensagem)
        if (error.message.includes('não encontrado')) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message.includes('já existe')) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }

        // Erros de autenticação
        if (error.message.includes('Token') || error.message.includes('autenticação')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
    }

    return NextResponse.json(
        { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
    );
}
