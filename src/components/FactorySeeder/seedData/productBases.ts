import type { ProductBase } from '@prisma/client';

const productBases: Omit<ProductBase, 'factoryId'>[] = [
	{
		code: 100,
		name: 'Base Oil A',
		description: 'Base Oil Type A'
	},
	{
		code: 101,
		name: 'Base Oil B',
		description: 'Base Oil Type B'
	},
	{
		code: 102,
		name: 'Base Oil C',
		description: 'Base Oil Type C'
	},
	{
		code: 110,
		name: 'Syn Base Oil A',
		description: 'Synthetic Base Oil Type A'
	},
	{
		code: 111,
		name: 'Syn Base Oil B',
		description: 'Synthetic Base Oil Type B'
	},
	{
		code: 112,
		name: 'Syn Base Oil C',
		description: 'Synthetic Base Oil Type C'
	},
	{
		code: 200,
		name: 'VI A',
		description: 'Viscosity Improver Type A'
	},
	{
		code: 201,
		name: 'VI B',
		description: 'Viscosity Improver Type B'
	},
	{
		code: 210,
		name: 'Syn VI A',
		description: 'Synthetic Viscosity Improver Type A'
	},
	{
		code: 300,
		name: 'AP 41548',
		description: 'Additive Package #41548'
	},
	{
		code: 301,
		name: 'AP 91114',
		description: 'Additive Package #91114'
	},
	{
		code: 500,
		name: '5W-20',
		description: 'Conventional 5W-20 motor oil.'
	},
	{
		code: 501,
		name: '5W-30',
		description: 'Conventional 5W-30 motor oil.'
	},
	{
		code: 502,
		name: '10W-30',
		description: 'Conventional 10W-30 motor oil.'
	},
	{
		code: 503,
		name: '10W-40',
		description: 'Conventional 10W-40 motor oil.'
	},
	{
		code: 525,
		name: 'FS 5W-20',
		description: 'Full synthetic 5W-20 motor oil.'
	},
	{
		code: 526,
		name: 'FS 5W-30',
		description: 'Full synthetic 5W-30 motor oil.'
	},
	{
		code: 527,
		name: 'FS 10W-30',
		description: 'Full synthetic 10W-30 motor oil.'
	},
	{
		code: 551,
		name: 'FS 5W-40 Euro',
		description: 'Full synthetic 5W-40 Euro formulation motor oil.'
	},
	{
		code: 600,
		name: 'HD 30',
		description: 'Heavy Duty 30W motor oil.'
	},
	{
		code: 601,
		name: 'HD 40',
		description: 'Heavy Duty 40W motor oil.'
	},
	{
		code: 602,
		name: 'HD 50',
		description: 'Heavy Duty 50W motor oil.'
	},
	{
		code: 644,
		name: 'HD 15W-40 CK-4',
		description: 'Heavy Duty 15W-40 motor oil meeting the CK-4 standard suitable for Tier 4 diesel engines.'
	},
	{
		code: 710,
		name: 'AW 22',
		description: 'AW 22 hydraulic fluid.'
	},
	{
		code: 711,
		name: 'AW 32',
		description: 'AW 32 hydraulic fluid.'
	},
	{
		code: 712,
		name: 'AW 46',
		description: 'AW 46 hydraulic fluid.'
	},
	{
		code: 713,
		name: 'AW 68',
		description: 'AW 68 hydraulic fluid.'
	},
	{
		code: 801,
		name: '80W-90',
		description: '80W-90 gear oil.'
	},
	{
		code: 804,
		name: '85W-140',
		description: '85W-140 gear oil.'
	},
	{
		code: 901,
		name: 'D/M ATF',
		description: 'Dexron III / Mercon (Dex/Merc) Automatic Transmission Fluid'
	},
	{
		code: 902,
		name: 'Universal ATF',
		description: 'Universal Automatic Transmission Fluid'
	}
];

export default productBases;

const isBaseOil = (baseCode: number) => 1 === Math.floor(baseCode / 100);
const isViscosityImprover = (baseCode: number) => 2 === Math.floor(baseCode / 100);
const isAdditivePackage = (baseCode: number) => 3 === Math.floor(baseCode / 100);
const isMotorOil = (baseCode: number) => [4, 5].includes(Math.floor(baseCode / 100));
const isHeavyDutyMotorOil = (baseCode: number) => 6 === Math.floor(baseCode / 100);
const isHydraulicFluid = (baseCode: number) => 7 === Math.floor(baseCode / 100);
const isGearOil = (baseCode: number) => 8 === Math.floor(baseCode / 100);
const isTransmissionFluid = (baseCode: number) => 9 === Math.floor(baseCode / 100);

export const BaseOilCategorizer = {
	isBaseOil,
	isViscosityImprover,
	isAdditivePackage,
	isMotorOil,
	isHeavyDutyMotorOil,
	isHydraulicFluid,
	isGearOil,
	isTransmissionFluid
};

export const groupBaseCodesByCategory = (baseCodes: Omit<ProductBase, 'factoryId'>[]) => baseCodes.reduce(
	(
		result: {
			[K in 'baseOils'
			| 'viscosityImprovers'
			| 'additivePackages'
			| 'motorOils'
			| 'heavyDutyMotorOils'
			| 'hydraulicFluids'
			| 'gearOils'
			| 'transmissionFluids'
			]: (Omit<ProductBase, 'factoryId'>)[]
		},
		curr
	) => {
		const baseCode = curr.code;

		if (isBaseOil(baseCode))
			return { ...result, baseOils: [...result.baseOils, curr] };
		if (isViscosityImprover(baseCode))
			return { ...result, viscosityImprovers: [...result.viscosityImprovers, curr] };
		if (isAdditivePackage(baseCode))
			return { ...result, additivePackages: [...result.additivePackages, curr] };
		if (isMotorOil(baseCode))
			return { ...result, motorOils: [...result.motorOils, curr] };
		if (isHeavyDutyMotorOil(baseCode))
			return { ...result, heavyDutyMotorOils: [...result.heavyDutyMotorOils, curr] };
		if (isHydraulicFluid(baseCode))
			return { ...result, hydraulicFluids: [...result.hydraulicFluids, curr] };
		if (isGearOil(baseCode))
			return { ...result, gearOils: [...result.gearOils, curr] };
		if (isTransmissionFluid(baseCode))
			return { ...result, transmissionFluids: [...result.transmissionFluids, curr] };

		return result;
	}, {
	baseOils: [],
	viscosityImprovers: [],
	additivePackages: [],
	motorOils: [],
	heavyDutyMotorOils: [],
	hydraulicFluids: [],
	gearOils: [],
	transmissionFluids: []
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const getRandomBaseCodeFromArray = (arr: ProductBase[]): ProductBase => arr[Math.floor(Math.random() * arr.length)]!;