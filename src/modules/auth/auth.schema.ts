import { z } from 'zod';

export const loginSchema = z.object({
  credential: z.string().min(1),
  pin: z.string().length(6).regex(/^\d{6}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
