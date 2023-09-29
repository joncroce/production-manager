import { z } from 'zod';

export const addFormulaSchema = z.object({
	factoryId: z.string(),
	baseCode: z.coerce.number().min(1).max(999),
	sizeCode: z.coerce.number().min(1),
	variantCode: z.coerce.number().min(0),
	formulaComponents: z
		.array(
			z.object({
				baseCode: z.coerce.number().min(100).max(999),
				sizeCode: z.coerce.number().min(1),
				variantCode: z.coerce.number().min(0),
				proportion: z.coerce.number().min(0).max(1),
				note: z.string().optional()
			})
		)
		.min(2, 'Formula must have at least 2 components.')
		.refine(components => components.reduce((totalProportion, current) => {
			return totalProportion + current.proportion;
		}, 0) === 1, 'Formula component proportions must sum up to 1.')
});
export type TAddFormulaSchema = z.infer<typeof addFormulaSchema>;