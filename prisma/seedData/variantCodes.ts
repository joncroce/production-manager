import type { ProductVariantCode } from '@prisma/client';

const variantCodes: ProductVariantCode[] = [
	{
		id: 0,
		name: 'N/A', // Not packaged for sale
		description: 'Not Applicable; internal production use only.',
		customerId: null
	},
	{
		id: 1,
		name: 'House Brand', // Generic
		description: 'Our generic standard offering under the "House Brand" label.',
		customerId: null
	},
	{
		id: 2,
		name: 'Conch Economy', // Private label
		description: 'Packaged for Conch under their "Conch Economy" label.',
		customerId: null // TODO: Add Customer seed data
	}
];

export default variantCodes;