import { z } from 'zod';

export const addFactorySchema = z.object({
	name: z.string(),
	userId: z.string()
});
export type TAddFactorySchema = z.infer<typeof addFactorySchema>;

export const changeFactoryNameSchema = z.object({
	id: z.string(),
	name: z.string()
});
export type TChangeFactoryNameSchema = z.infer<typeof changeFactoryNameSchema>;