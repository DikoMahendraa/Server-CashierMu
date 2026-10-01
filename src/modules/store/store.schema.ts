import { z } from 'zod';

export const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  serviceChargeEnabled: z.boolean().optional(),
  serviceChargeRate: z.number().min(0).max(1).optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  shiftEnabled: z.boolean().optional(),
  shiftRequireOpeningBalance: z.boolean().optional(),
  shiftBranchSelection: z.boolean().optional(),
});

export type UpdateStoreDto = z.infer<typeof updateStoreSchema>;
