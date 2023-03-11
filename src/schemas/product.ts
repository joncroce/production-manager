import { z } from 'zod';

export const addProductSchema = z.object({
	baseCodeId: z.coerce.number(),
	sizeCodeId: z.coerce.number(),
	variantCodeId: z.coerce.number(),
	description: z.string().optional().default(''),
	quantityInStock: z.coerce.number().optional().default(0),
	salesPrice: z.coerce.number().optional().default(99999)
});

export const viewProductSchema = z.object({
	code: z.string(),
}).merge(addProductSchema);

export type AddProduct = z.infer<typeof addProductSchema>;
export type ViewProduct = z.infer<typeof viewProductSchema>;