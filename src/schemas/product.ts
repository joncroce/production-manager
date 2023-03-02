import { z } from 'zod';

export default z.object({
	baseCodeId: z.coerce.number(),
	sizeCodeId: z.coerce.number(),
	variantCodeId: z.coerce.number(),
	description: z.string().optional().default(''),
	quantityInStock: z.coerce.number().optional().default(0),
	salesPrice: z.coerce.number().optional().default(99999)
});