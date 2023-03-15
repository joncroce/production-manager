import { z } from 'zod';
import { addAddressSchema } from './address';

export const addCustomerSchema = z.object({
	name: z.string(),
	DefaultShippingAddress: addAddressSchema,
	DefaultBillingAddress: addAddressSchema,
});

export type AddCustomer = z.infer<typeof addCustomerSchema>;