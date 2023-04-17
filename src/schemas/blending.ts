import { z } from 'zod';

export const blendStatusSchema = z.enum(
	[
		'CREATED', 'QUEUED', 'ASSEMBLING',
		'BLENDING', 'TESTING', 'ADJUSTING',
		'PASSED', 'PUSHED', 'FLAGGED', 'COMPLETE'
	]
);

export const addFormulaSchema = z.object({
	baseCodeId: z.coerce.number().min(100).max(999),
	sizeCodeId: z.coerce.number().optional().default(1),
	variantCodeId: z.coerce.number().optional().default(0),
	formulaComponents: z.array(z.object({
		baseCodeId: z.coerce.number().min(100).max(999),
		sizeCodeId: z.coerce.number().min(1).optional().default(1),
		variantCodeId: z.coerce.number().optional().default(0),
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
	baseCodeId: z.coerce.number().min(100).max(999),
	sizeCodeId: z.coerce.number().min(1).optional().default(1),
	variantCodeId: z.coerce.number().optional().default(0),
	formulaId: z.string(),
	targetQuantity: z.coerce.number(),
	destinationTankId: z.string().optional(),
	note: z.string().optional(),
	status: blendStatusSchema.optional().default('CREATED'),
	components: z.array(
		z.object({
			formulaComponentId: z.string(),
			sourceTankId: z.string(),
			targetQuantity: z.coerce.number(),
			note: z.string().optional()
		})
	)
});

export const getBlendableProductSchema = z.object({
	baseCodeId: z.coerce.number().min(100).max(999).optional(),
	sizeCodeId: z.coerce.number().min(1).optional().default(1),
	variantCodeId: z.coerce.number().optional().default(1)
});