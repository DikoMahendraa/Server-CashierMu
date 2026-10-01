import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().default('package'),
  color: z.string().default('#6366f1'),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
