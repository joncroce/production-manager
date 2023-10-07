import type { ProductSize } from '@prisma/client';

const productSizes: Omit<ProductSize, 'factoryId'>[] = [
	{
		code: 1,
		name: 'Bulk',
		description: 'Bulk product (typically in tank storange).'
	},
	{
		code: 5,
		name: 'Pail',
		description: '5 Gallon Pail'
	},
	{
		code: 55,
		name: 'Drum',
		description: '55 Gallon Drum'
	},
	{
		code: 275,
		name: 'Tote (275)',
		description: '275 Gallon Tote'
	},
	{
		code: 330,
		name: 'Tote (330)',
		description: '330 Gallon Tote'
	}
];

export default productSizes;