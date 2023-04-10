import baseCodes, { groupBaseCodesByCategory, getRandomBaseCodeFromArray } from './baseCodes';
import type { AddFormula } from '@/schemas/blending';


const {
	baseOils,
	viscosityImprovers,
	additivePackages
} = groupBaseCodesByCategory(baseCodes);

export const generateRandomBlendFormula = (baseCodeId: number): AddFormula => {
	const additivePackageFormulaComponent = {
		baseCodeId: getRandomBaseCodeFromArray(additivePackages).id,
		proportion: Math.ceil(Math.random() * 5) / 100 // Between 0.01 and 0.05
	};

	const viscosityImproverFormulaComponent = {
		baseCodeId: getRandomBaseCodeFromArray(viscosityImprovers).id,
		proportion: Math.ceil(Math.random() * 20) / 100 // Between 0.1 and 0.20
	};

	const baseOilFormulaComponent = {
		baseCodeId: getRandomBaseCodeFromArray(baseOils).id,
		proportion: 1 - viscosityImproverFormulaComponent.proportion - additivePackageFormulaComponent.proportion
	};

	return {
		baseCodeId,
		formulaComponents: [
			baseOilFormulaComponent,
			viscosityImproverFormulaComponent,
			additivePackageFormulaComponent
		]
	};
};