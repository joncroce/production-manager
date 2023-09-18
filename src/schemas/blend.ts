import { z } from 'zod';

export const blendStatusSchema = z.enum(
	[
		'CREATED', 'QUEUED', 'ASSEMBLING',
		'BLENDING', 'TESTING', 'ADJUSTING',
		'PASSED', 'PUSHED', 'FLAGGED', 'COMPLETE'
	]
);
export type TBlendStatus = z.infer<typeof blendStatusSchema>;
export const ACTIVE_BLEND_STATUSES: Array<z.infer<typeof blendStatusSchema>> = [
	'ASSEMBLING', 'BLENDING', 'TESTING', 'ADJUSTING', 'PASSED', 'FLAGGED'
];

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
	baseCode: z.coerce.number(),
	sizeCode: z.coerce.number(),
	variantCode: z.coerce.number(),
	targetQuantity: z.coerce.number(),
	destinationTankName: z.string(),
	note: z.string().optional(),
	status: blendStatusSchema.optional().default('CREATED'),
	components: z.array(
		z.object({
			baseCode: z.coerce.number(),
			sizeCode: z.coerce.number(),
			variantCode: z.coerce.number(),
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

export const blendSummarySchema = z.object({
	id: z.string(),
	baseCode: z.string(),
	targetQuantity: z.number(),
	actualQuantity: z.number().optional(),
	blendTankName: z.string().optional(),
	destinationTankName: z.string().optional(),
	status: z.string(),
	createdAt: z.number(),
	updatedAt: z.number(),
});
export type TBlendSummary = z.infer<typeof blendSummarySchema>;