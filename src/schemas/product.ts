import { z } from 'zod';

export const addProductSchema = z.object({
	factoryId: z.string(),
	baseCode: z.coerce.number(),
	sizeCode: z.coerce.number(),
	variantCode: z.coerce.number(),
	description: z.string().optional().default(''),
	quantityInStock: z.coerce.number().optional().default(0),
	salesPrice: z.coerce.number().optional()
});
export type TAddProductSchema = z.infer<typeof addProductSchema>;

export const getBlendableProductSchema = z.object({
	factoryId: z.string(),
	baseCode: z.coerce.number().min(100).max(999).optional(),
	sizeCode: z.coerce.number().min(1).optional().default(1),
	variantCode: z.coerce.number().optional().default(1)
});
export type TGetBlendableProductSchema = z.infer<typeof getBlendableProductSchema>;

export const addProductCodePartSchema = z.object({
	factoryId: z.string(),
	code: z.coerce.number(),
	name: z.string(),
	description: z.string().optional().default(''),
});

export type TAddProductCodePartSchema = z.infer<typeof addProductCodePartSchema>;