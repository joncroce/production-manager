import { z } from 'zod';

export const addAddressSchema = z.object({
	streetLine1: z.string(),
	streetLine2: z.string().optional(),
	city: z.string(),
	zip: z.string(),
});