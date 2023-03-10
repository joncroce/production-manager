import { z } from 'zod';

export const addAddressSchema = z.object({
	street: z.string(),
	city: z.string(),
	state: z.string(),
	zip: z.string(),
});