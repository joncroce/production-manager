import { z } from 'zod';

export const addFormulaSchema = z.object({
	factoryId: z.string(),
	baseCode: z.coerce.number().min(100).max(999),
	sizeCode: z.coerce.number().optional().default(1),
	variantCode: z.coerce.number().optional().default(0),
	formulaComponents: z.array(z.object({
		baseCode: z.coerce.number().min(100).max(999),
		sizeCode: z.coerce.number().min(1).optional().default(1),
		variantCode: z.coerce.number().optional().default(0),
		proportion: z.coerce.number().min(0).max(1),
		note: z.string().optional()
	}))
});
export type TAddFormulaSchema = z.infer<typeof addFormulaSchema>;