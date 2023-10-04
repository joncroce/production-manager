import { z } from 'zod';

export const addProductSchema = z.object({
	factoryId: z.string(),
	baseCode: z.coerce.number().min(1).max(999),
	sizeCode: z.coerce.number().min(1).max(999),
	variantCode: z.coerce.number().min(0).max(999),
	description: z.string().optional().default(''),
	quantityInStock: z.coerce.number().min(0).optional().default(0),
	salesPrice: z.coerce.number().min(0).optional()
});
export type TAddProductSchema = z.infer<typeof addProductSchema>;

export const getBlendableProductSchema = z.object({
	factoryId: z.string(),
	baseCode: z.coerce.number().min(1).max(999),
	sizeCode: z.coerce.number().min(1).max(999).optional().default(1),
	variantCode: z.coerce.number().min(0).max(999).optional().default(0)
});
export type TGetBlendableProductSchema = z.infer<typeof getBlendableProductSchema>;

export const addProductCodePartSchema = z.object({
	factoryId: z.string(),
	code: z.coerce.number().min(0).max(999),
	name: z.string(),
	description: z.string().optional().default(''),
});

export type TAddProductCodePartSchema = z.infer<typeof addProductCodePartSchema>;