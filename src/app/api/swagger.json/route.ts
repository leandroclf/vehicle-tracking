import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

// Este endpoint serve o arquivo JSON da especificação Swagger
export async function GET() {
  return NextResponse.json(swaggerSpec);
} 