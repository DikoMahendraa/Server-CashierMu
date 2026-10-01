import { z } from 'zod';

export const createPendingBillSchema = z.object({
  label: z.string().min(1),
  items: z.array(z.any()),
  discountType: z.string().optional(),
  discountValue: z.coerce.number().optional(),
  discountLabel: z.string().optional(),
  subtotal: z.coerce.number().min(0),
  itemCount: z.coerce.number().int().min(0),
  branchId: z.string().uuid(),
});

export const updatePendingBillSchema = createPendingBillSchema.partial();

export type CreatePendingBillDto = z.infer<typeof createPendingBillSchema>;
export type UpdatePendingBillDto = z.infer<typeof updatePendingBillSchema>;
