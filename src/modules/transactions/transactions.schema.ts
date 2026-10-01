import { z } from 'zod';

const selectedVariantSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionLabel: z.string(),
  priceModifier: z.number(),
});

const transactionItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  selectedVariants: z.array(selectedVariantSchema).default([]),
  note: z.string().default(''),
});

const discountSchema = z.object({
  type: z.enum(['percent', 'nominal']),
  value: z.number().min(0),
  label: z.string().default(''),
  code: z.string().nullable().optional(),
});

const paymentSchema = z.object({
  method: z.enum(['cash', 'qris', 'transfer', 'debit_card', 'credit_card']),
  amount: z.number().min(0),
  reference: z.string().nullable().optional(),
});

export const createTransactionSchema = z.object({
  shiftId: z.string().uuid(),
  branchId: z.string().uuid(),
  customerName: z.string().default(''),
  note: z.string().default(''),
  items: z.array(transactionItemSchema).min(1),
  discount: discountSchema.optional(),
  payments: z.array(paymentSchema).min(1),
  cashPaid: z.number().min(0).default(0),
});

export const voidTransactionSchema = z.object({
  ownerPin: z.string().length(6).regex(/^\d{6}$/),
  reason: z.string().min(1),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type VoidTransactionDto = z.infer<typeof voidTransactionSchema>;
