import { z } from 'zod';

export const addTankSchema = z.object({
	factoryId: z.string(),
	name: z.string(),
	baseCode: z.coerce.number(),
	sizeCode: z.coerce.number(),
	variantCode: z.coerce.number(),
	quantity: z.coerce.number(),
	capacity: z.coerce.number(),
	heel: z.coerce.number(),
	isDefaultSource: z.boolean().optional().default(false),
});

export type TAddTankSchema = z.infer<typeof addTankSchema>;