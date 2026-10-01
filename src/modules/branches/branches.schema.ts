import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1),
  address: z.string().default(''),
  phone: z.string().default(''),
});

export const updateBranchSchema = createBranchSchema.partial();

export type CreateBranchDto = z.infer<typeof createBranchSchema>;
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;
