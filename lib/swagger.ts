import { createSwaggerSpec } from 'next-swagger-doc';

const apiFolder = './app/api';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'eService API',
        version: '1.0.0',
        description: 'Comprehensive eService platform API for managing appointments, staff, offices, and user services',
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production'
            ? 'https://your-domain.com'
            : 'http://localhost:3000',
          description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
          },
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              phoneNumber: { type: 'string', description: 'Ethiopian phone number' },
              username: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'manager', 'staff', 'user'] },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          Office: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              address: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string', format: 'email' },
              isActive: { type: 'boolean' },
              managerId: { type: 'string', format: 'uuid' },
            },
          },
          Service: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'integer', minimum: 1 },
              price: { type: 'number', minimum: 0 },
              isActive: { type: 'boolean' },
            },
          },
          Appointment: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              serviceId: { type: 'string', format: 'uuid' },
              officeId: { type: 'string', format: 'uuid' },
              staffId: { type: 'string', format: 'uuid' },
              date: { type: 'string', format: 'date' },
              time: { type: 'string', format: 'time' },
              status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
              },
              notes: { type: 'string' },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['phoneNumber', 'password'],
            properties: {
              phoneNumber: {
                type: 'string',
                description: 'Ethiopian phone number',
                example: '0912345678'
              },
              password: { type: 'string', minLength: 6 },
            },
          },
          LoginResponse: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string' },
              expiresIn: { type: 'integer' },
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'integer' },
            },
          },
          Request: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              requestNumber: { type: 'string', example: 'REQ-20241227-001', description: 'Sequential request number in format REQ-YYYYMMDD-XXX' },
              userId: { type: 'string', format: 'uuid' },
              serviceId: { type: 'string', format: 'uuid' },
              statusbystaff: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
              statusbyadmin: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      security: [
        { BearerAuth: [] },
        { ApiKeyAuth: [] },
      ],
    },
    apiFolder,
  });

  return spec;
};
