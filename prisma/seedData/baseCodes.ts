import type { ProductBaseCode } from '@prisma/client';

const baseCodes: ProductBaseCode[] = [
	{
		id: 500,
		name: '5W-20',
		description: 'Conventional 5W-20 motor oil.'
	},
	{
		id: 501,
		name: '5W-30',
		description: 'Conventional 5W-30 motor oil.'
	},
	{
		id: 502,
		name: '10W-30',
		description: 'Conventional 10W-30 motor oil.'
	},
	{
		id: 503,
		name: '10W-40',
		description: 'Conventional 10W-40 motor oil.'
	},
	{
		id: 525,
		name: 'FS 5W-20',
		description: 'Full synthetic 5W-20 motor oil.'
	},
	{
		id: 526,
		name: 'FS 5W-30',
		description: 'Full synthetic 5W-30 motor oil.'
	},
	{
		id: 527,
		name: 'FS 10W-30',
		description: 'Full synthetic 10W-30 motor oil.'
	},
	{
		id: 551,
		name: 'FS 5W-40 Euro',
		description: 'Full synthetic 5W-40 Euro formulation motor oil.'
	},
	{
		id: 600,
		name: 'HD 30',
		description: 'Heavy Duty 30W motor oil.'
	},
	{
		id: 601,
		name: 'HD 40',
		description: 'Heavy Duty 40W motor oil.'
	},
	{
		id: 602,
		name: 'HD 50',
		description: 'Heavy Duty 50W motor oil.'
	},
	{
		id: 644,
		name: 'HD 15W-40 CK-4',
		description: 'Heavy Duty 15W-40 motor oil meeting the CK-4 standard suitable for Tier 4 diesel engines.'
	},
	{
		id: 710,
		name: 'AW 22',
		description: 'AW 22 hydraulic fluid.'
	},
	{
		id: 711,
		name: 'AW 32',
		description: 'AW 32 hydraulic fluid.'
	},
	{
		id: 712,
		name: 'AW 46',
		description: 'AW 46 hydraulic fluid.'
	},
	{
		id: 713,
		name: 'AW 68',
		description: 'AW 68 hydraulic fluid.'
	},
	{
		id: 801,
		name: '80W-90',
		description: '80W-90 gear oil.'
	},
	{
		id: 804,
		name: '85W-140',
		description: '85W-140 gear oil.'
	},
	{
		id: 901,
		name: 'D/M ATF',
		description: 'Dexron III / Mercon (Dex/Merc) Automatic Transmission Fluid'
	},
	{
		id: 902,
		name: 'Universal ATF',
		description: 'Universal Automatic Transmission Fluid'
	}
];

export default baseCodes;