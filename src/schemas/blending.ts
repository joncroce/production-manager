import { z } from 'zod';

export const addFormulaSchema = z.object({
	baseCodeId: z.coerce.number().min(100).max(999),
	formulaComponents: z.array(z.object({
		baseCodeId: z.coerce.number().min(100).max(999),
		proportion: z.coerce.number().min(0).max(1),
		note: z.string().optional()
	}))
});