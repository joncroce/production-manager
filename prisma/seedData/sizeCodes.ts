import type { ProductSizeCode } from '@prisma/client';

const sizeCodes: ProductSizeCode[] = [
	{
		id: 0,
		name: 'N/A',
		description: 'Not Applicable'
	},
	{
		id: 1,
		name: 'Bulk',
		description: 'Bulk product (typically in tank storange).'
	},
	{
		id: 5,
		name: 'Pail',
		description: '5 Gallon Pail'
	},
	{
		id: 55,
		name: 'Drum',
		description: '55 Gallon Drum'
	},
	{
		id: 275,
		name: 'Tote (275)',
		description: '275 Gallon Tote'
	},
	{
		id: 330,
		name: 'Tote (330)',
		description: '330 Gallon Tote'
	}
];

export default sizeCodes;