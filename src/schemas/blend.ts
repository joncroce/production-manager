import { z } from 'zod';

export const blendStatusSchema = z.enum(
	[
		'CREATED', 'QUEUED', 'ASSEMBLING',
		'BLENDING', 'TESTING', 'ADJUSTING',
		'PASSED', 'PUSHED', 'FLAGGED', 'COMPLETE'
	]
);

export const blendComponentSchema = z.object({
	formulaComponentId: z.string(),
	blendId: z.string(),
	sourceTankName: z.string(),
	targetQuantity: z.coerce.number(),
	actualQuantity: z.coerce.number().optional(),
	note: z.string().optional()
});

export const addBlendSchema = z.object({
	factoryId: z.string(),
	formulaId: z.string(),
	targetQuantity: z.coerce.number(),
	destinationTankName: z.string(),
	note: z.string().optional(),
	status: blendStatusSchema.optional().default('CREATED'),
	components: z.array(
		z.object({
			formulaComponentId: z.string(),
			sourceTankName: z.string(),
			targetQuantity: z.coerce.number(),
			note: z.string().optional()
		})
	)
});
export type TAddBlendSchema = z.infer<typeof addBlendSchema>;


export const getBlendsByStatusSchema = z.object({
	factoryId: z.string(),
	status: z.array(blendStatusSchema).default(['CREATED'])
});
export type TGetBlendsByStatusSchema = z.infer<typeof getBlendsByStatusSchema>;