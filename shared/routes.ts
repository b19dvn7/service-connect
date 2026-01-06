import { z } from 'zod';
import { insertMaintenanceRequestSchema, maintenanceRequests } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/me',
      responses: {
        200: z.object({ id: z.string(), username: z.string() }).nullable(),
      }
    }
  },
  requests: {
    list: {
      method: 'GET' as const,
      path: '/api/requests',
      responses: {
        200: z.array(z.custom<typeof maintenanceRequests.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/requests/:id',
      responses: {
        200: z.custom<typeof maintenanceRequests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/requests',
      input: insertMaintenanceRequestSchema,
      responses: {
        201: z.custom<typeof maintenanceRequests.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/requests/:id',
      input: z.object({
        status: z.string().optional(),
        workDone: z.string().optional(),
        partsUsed: z.array(z.object({ name: z.string(), quantity: z.number() })).optional(),
        notes: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof maintenanceRequests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
