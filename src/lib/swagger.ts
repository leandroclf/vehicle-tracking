import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Rastreamento de Veículos',
      version: '1.0.0',
      description: 'Documentação da API do sistema de rastreamento de veículos',
      contact: {
        name: 'Suporte Técnico',
        email: 'suporte@rastreamento.com'
      },
      license: {
        name: 'Licença Proprietária',
        url: 'https://rastreamento.com/licenca'
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.rastreamento.com',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Esquemas de dados comuns
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro'
            },
            details: {
              type: 'object',
              example: null
            },
            status: {
              type: 'number',
              example: 400
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-10-25T14:30:00Z'
            }
          }
        },
        
        // Veículos
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            license_plate: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            vin: { type: 'string' },
            user_id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        // Motoristas
        Driver: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            license_number: { type: 'string' },
            license_type: { type: 'string' },
            license_expiry: { type: 'string', format: 'date' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            status: { type: 'string', enum: ['active', 'inactive', 'vacation', 'medical_leave'] },
            user_id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        // Geocercas
        Geofence: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['polygon', 'circle'] },
            coordinates: { type: 'string' },
            radius: { type: 'number' },
            color: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            user_id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        // Configurações
        UserPreferences: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark', 'system'] },
            sidebar_collapsed: { type: 'boolean' },
            dashboard_layout: { type: 'string', enum: ['compact', 'detailed', 'grid'] },
            favorite_vehicles: { type: 'array', items: { type: 'string' } },
            default_page: { type: 'string', enum: ['dashboard', 'map', 'vehicles', 'reports'] },
            distance_unit: { type: 'string', enum: ['km', 'mi'] },
            language: { type: 'string', enum: ['pt-BR', 'en-US', 'es'] },
            map_settings: {
              type: 'object',
              properties: {
                default_zoom: { type: 'integer', minimum: 1, maximum: 20 },
                show_traffic: { type: 'boolean' },
                show_weather: { type: 'boolean' },
                style: { type: 'string', enum: ['standard', 'satellite', 'terrain', 'night'] }
              }
            }
          }
        },
        
        NotificationSettings: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            email_notifications: { type: 'boolean' },
            push_notifications: { type: 'boolean' },
            sms_notifications: { type: 'boolean' },
            notification_types: { type: 'array', items: { type: 'string' } },
            time_threshold: { type: 'integer', minimum: 1 }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acesso ausente, inválido ou expirado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Não autorizado',
                status: 401,
                timestamp: '2023-10-25T14:30:00Z'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Recurso não encontrado',
                status: 404,
                timestamp: '2023-10-25T14:30:00Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erro de validação de dados enviados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Dados inválidos',
                details: {
                  field: ['O campo é obrigatório']
                },
                status: 400,
                timestamp: '2023-10-25T14:30:00Z'
              }
            }
          }
        },
        ServerError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Erro interno do servidor',
                status: 500,
                timestamp: '2023-10-25T14:30:00Z'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/app/api/**/route.ts',
    './src/lib/swagger/*.yaml'
  ]
};

export const swaggerSpec = swaggerJSDoc(options); 