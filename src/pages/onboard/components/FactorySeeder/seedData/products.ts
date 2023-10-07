import productBases from './productBases';
import productVariants from './productVariants';
import type { TAddProductSchema } from '@/schemas/product';

/**
 * Uses the first 2 digits of the base code to determine cost.
 */
const pricePerGallonByBaseCode: Record<number, number> = {
	50: 1.85,
	52: 2.65,
	55: 2.85,
	60: 2.90,
	64: 3.10,
	71: 1.70,
	80: 3.40,
	90: 3.10
};

/**
 * Default price for productBases missed by pricePerGallonByBaseCode
 */
const defaultPrice = 2.00;

/**
 * Price multiplier using the sizeCodes that indicate # of gallons 
 */
const priceMultiplierBySizeCode: Record<number, number> = {
	1: 1, // BULK
	5: 8,
	55: 62,
	275: 300,
	330: 360
};

/**
 * Price multiplier for non-"House Brand" product variants.
 */
const priceMultiplierForPrivateLabel = 1.05;

const calculateSalesPrice = (baseCode: number, sizeCode: number, variantCode?: number) => {
	const firstTwoDigitsOfBaseCodeId = Math.floor(baseCode / 10);
	const pricePerGallon = pricePerGallonByBaseCode[firstTwoDigitsOfBaseCodeId] ?? defaultPrice;
	const priceMultiplier = (priceMultiplierBySizeCode[sizeCode] ?? sizeCode) * (variantCode && variantCode > 1 ? priceMultiplierForPrivateLabel : 1);

	return pricePerGallon * priceMultiplier;
};

/**
 * Generate bulk products for all productBases
 */
const bulkProducts: Omit<TAddProductSchema, 'factoryId'>[] = productBases.map(({ code, name }) => ({
	baseCode: code,
	sizeCode: 1,
	variantCode: 0,
	description: `${name} Bulk`,
	quantityInStock: Math.floor(Math.random() * 10_000),
	salesPrice: calculateSalesPrice(code, 1, 0)
}));

/**
 * Pailed productBases for hydraulic fluids (700s), gear oils (800s), and automatic transmission fluids (900s)
 */
const pailedBaseCodes = productBases.filter(({ code }) => [7, 8, 9].includes(Math.floor(code / 100)));

/**
 * Generate "House Brand" pail products
 */
const pailProductsHouseBrand: Omit<TAddProductSchema, 'factoryId'>[] = pailedBaseCodes
	.map(({ code, name }) => ({
		baseCode: code,
		sizeCode: 5,
		variantCode: 1,
		description: `"${productVariants[1]?.name ?? 'House Brand'}" ${name} Pail`,
		quantityInStock: Math.ceil(Math.random() * 10) * 12 * 3, // 1-20 pallets in 12-block x 3-high
		salesPrice: calculateSalesPrice(code, 5, 1)
	}));

/**
 * Generate private label pail products
 */
const pailProductsPrivateLabel: Omit<TAddProductSchema, 'factoryId'>[] = pailedBaseCodes
	.map(({ code, name }) => ({
		baseCode: code,
		sizeCode: 5,
		variantCode: 2,
		description: `"${productVariants[2]?.name ?? 'Private Label'}" ${name} Pail`,
		quantityInStock: Math.ceil(Math.random() * 10) * 12 * 3, // 1-10 pallets in 12-block x 3-high
		salesPrice: calculateSalesPrice(code, 5, 2)
	}));

/**
 * Drummed productBases for motor oils (500s & 600s), hydraulic fluids (700s), gear oils (800s), and automatic transmission fluids (900s)
 */
const drummedBaseCodes = productBases.filter(({ code }) => [5, 6, 7, 8, 9].includes(Math.floor(code / 100)));

/**
 * Generate "House Brand" drum products
 */
const drumProductsHouseBrand: Omit<TAddProductSchema, 'factoryId'>[] = drummedBaseCodes
	.map(({ code, name }) => ({
		baseCode: code,
		sizeCode: 55,
		variantCode: 1,
		description: `"${productVariants[1]?.name ?? 'House Brand'}" ${name} Drum`,
		quantityInStock: Math.ceil(Math.random() * 10) * 4, // 1-10 pallets in 4-block
		salesPrice: calculateSalesPrice(code, 55, 1)
	}));

/**
 * Generate private label drum products
 */
const drumProductsPrivateLabel: Omit<TAddProductSchema, 'factoryId'>[] = drummedBaseCodes
	.map(({ code, name }) => ({
		baseCode: code,
		sizeCode: 55,
		variantCode: 2,
		description: `"${productVariants[2]?.name ?? 'Private Label'}" ${name} Drum`,
		quantityInStock: Math.ceil(Math.random() * 10) * 4, // 1-5 pallets in 4-block
		salesPrice: calculateSalesPrice(code, 55, 2)
	}));

/**
 * Toted productBases for additive packages (300s & 400s), motor oils (500s & 600s), hydraulic fluids (700s), gear oils (800s), and automatic transmission fluids (900s)
 */
const totedBaseCodes = productBases.filter(({ code }) => [3, 4, 5, 6, 7, 8, 9].includes(Math.floor(code / 100)));

/**
 * Generate unbranded tote products
 */
const toteProducts: Omit<TAddProductSchema, 'factoryId'>[] = totedBaseCodes
	.map(({ code, name }) => {
		const size = Math.round(Math.random()) ? 275 : 330; // 50/50 whether small (275gal) or large (330gal) tote 
		return {
			baseCode: code,
			sizeCode: size,
			variantCode: 0, // N/A (not for distribution; internal production use only)
			description: `${name} Tote (${size}gal)`,
			quantityInStock: Math.floor(Math.random() * 12), // 0-12
			salesPrice: calculateSalesPrice(code, size, 0)
		};
	});

const products: Omit<TAddProductSchema, 'factoryId'>[] = [
	...bulkProducts,
	...pailProductsHouseBrand,
	...pailProductsPrivateLabel,
	...drumProductsHouseBrand,
	...drumProductsPrivateLabel,
	...toteProducts
];

export default products;