import productBases, { groupBaseCodesByCategory, getRandomBaseCodeFromArray } from './productBases';
import type { TAddFormulaSchema } from '@/schemas/formula';

const {
	baseOils,
	viscosityImprovers,
	additivePackages
} = groupBaseCodesByCategory(productBases);


export const generateRandomBlendFormula = ({ factoryId, baseCode, sizeCode = 1, variantCode = 0 }: {
	factoryId: string;
	baseCode: number;
	sizeCode?: number;
	variantCode?: number;
}): TAddFormulaSchema => {
	const additivePackageFormulaComponent = {
		baseCode: getRandomBaseCodeFromArray(additivePackages.map((baseCode) => ({ ...baseCode, factoryId }))).code,
		sizeCode,
		variantCode,
		proportion: Math.ceil(Math.random() * 5) / 100 // Between 0.01 and 0.05
	};

	const viscosityImproverFormulaComponent = {
		baseCode: getRandomBaseCodeFromArray(viscosityImprovers.map((baseCode) => ({ ...baseCode, factoryId }))).code,
		sizeCode,
		variantCode,
		proportion: Math.ceil(Math.random() * 20) / 100 // Between 0.1 and 0.20
	};

	const baseOilFormulaComponent = {
		baseCode: getRandomBaseCodeFromArray(baseOils.map((baseCode) => ({ ...baseCode, factoryId }))).code,
		sizeCode,
		variantCode,
		proportion: 1 - viscosityImproverFormulaComponent.proportion - additivePackageFormulaComponent.proportion
	};

	return {
		factoryId,
		baseCode,
		sizeCode,
		variantCode,
		formulaComponents: [
			baseOilFormulaComponent,
			viscosityImproverFormulaComponent,
			additivePackageFormulaComponent
		]
	};
};