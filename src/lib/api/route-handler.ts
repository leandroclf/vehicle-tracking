import { NextRequest, NextResponse } from 'next/server';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type HandlerFunction = (req: NextRequest) => Promise<NextResponse>;

export const createRouteHandler = (
  allowedMethods: HttpMethod[],
  handler: HandlerFunction
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const method = req.method.toUpperCase() as HttpMethod;
      
      if (!allowedMethods.includes(method)) {
        return NextResponse.json(
          { error: 'Método não permitido' },
          { status: 405 }
        );
      }

      const response = await handler(req);
      
      // Garante que a resposta seja sempre um NextResponse
      if (!(response instanceof NextResponse)) {
        throw new Error('Handler deve retornar NextResponse');
      }

      return response;
    } catch (error) {
      console.error('Erro no route handler:', error);
      
      if (error instanceof Error) {
        // Se for um erro conhecido, retorna a mensagem específica
        return NextResponse.json(
          { error: error.message },
          { status: error.name === 'ValidationError' ? 400 : 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
  };
}; 