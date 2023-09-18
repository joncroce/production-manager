import { z } from 'zod';

export const addTankSchema = z.object({
	factoryId: z.string(),
	name: z.string().min(1, 'Please enter a valid name.'),
	baseCode: z.coerce.number().optional(),
	sizeCode: z.coerce.number().optional().default(1),
	variantCode: z.coerce.number().optional().default(0),
	quantity: z.coerce.number(),
	capacity: z.coerce.number(),
	heel: z.coerce.number(),
	isDefaultSource: z.boolean().optional().default(false),
	isBlendTank: z.boolean().optional().default(false)
});
export type TAddTankSchema = z.infer<typeof addTankSchema>;

export const updateTankSchema = addTankSchema
	.merge(
		z.object({
			updatedName: z.string().min(1, 'Please enter a valid name.')
		})
	);
export type TUpdateTankSchema = z.infer<typeof updateTankSchema>;

export const tankSummarySchema = z.object({
	name: z.string(),
	baseCode: z.string().optional(),
	quantity: z.coerce.number(),
	capacity: z.coerce.number(),
	isBlendTank: z.boolean()
});
export type TTankSummary = z.infer<typeof tankSummarySchema>;