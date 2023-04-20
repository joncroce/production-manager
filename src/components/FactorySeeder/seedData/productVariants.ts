import type { ProductVariant } from '@prisma/client';

const productVariants: Omit<ProductVariant, 'factoryId'>[] = [
	{
		code: 0,
		name: 'N/A', // Not packaged for sale
		description: 'Not Applicable; internal production use only.'
	},
	{
		code: 1,
		name: 'House Brand', // Generic
		description: 'Our generic standard offering under the "House Brand" label.'
	},
	{
		code: 2,
		name: 'Conch Economy', // Private label
		description: 'Packaged for Conch under their "Conch Economy" label.'
	}
];

export default productVariants;