import { z } from 'zod';

const variantOptionSchema = z.object({
  label: z.string().min(1),
  priceModifier: z.number().default(0),
  sortOrder: z.number().int().default(0),
});

const variantGroupSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(false),
  multiSelect: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  options: z.array(variantOptionSchema).default([]),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  categoryId: z.string().uuid(),
  buyPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  stock: z.number().int().default(0),
  minStock: z.number().int().default(5),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  taxable: z.boolean().default(true),
  unit: z.string().default('pcs'),
  variantGroups: z.array(variantGroupSchema).default([]),
});

export const updateProductSchema = createProductSchema.omit({ variantGroups: true }).partial();

export const adjustStockSchema = z.object({
  adjustment: z.number().int(),
  reason: z.string().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
