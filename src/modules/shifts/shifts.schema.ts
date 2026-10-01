import { z } from 'zod';

export const openShiftSchema = z.object({
  type: z.enum(['pagi', 'siang', 'malam']),
  openingBalance: z.number().min(0).default(0),
  branchId: z.string().uuid(),
});

export const closeShiftSchema = z.object({
  closingBalance: z.number().min(0),
  notes: z.string().default(''),
});

export type OpenShiftDto = z.infer<typeof openShiftSchema>;
export type CloseShiftDto = z.infer<typeof closeShiftSchema>;
