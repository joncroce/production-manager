import { z } from 'zod';

export const addFormulaSchema = z.object({
	baseCodeId: z.coerce.number().min(100).max(999),
	formulaComponents: z.array(z.object({
		baseCodeId: z.coerce.number().min(100).max(999),
		proportion: z.coerce.number().min(0).max(1),
		note: z.string().optional()
	}))
});

export type AddFormula = z.infer<typeof addFormulaSchema>;

export const blendComponentSchema = z.object({
	formulaComponentId: z.string(),
	blendId: z.string(),
	sourceTankId: z.string(),
	targetQuantity: z.coerce.number(),
	actualQuantity: z.coerce.number().optional(),
	note: z.string().optional()
});

export const addBlendSchema = z.object({
	productId: z.coerce.number().min(100).max(999),
	formulaId: z.string(),
	targetQuantity: z.coerce.number(),
	destinationTankId: z.string(),
	note: z.string().optional(),
	components: z.array(
		z.object({
			baseCodeId: z.coerce.number().min(100).max(999),
			sourceTankId: z.string(),
			targetQuantity: z.coerce.number(),
			note: z.string().optional()
		})
	)
});
