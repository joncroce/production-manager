import { z } from 'zod';

export default z.object({
	id: z.coerce.number(),
	name: z.string(),
	description: z.string().optional(),
});