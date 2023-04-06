import type { Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import baseCodes from './baseCodes';
import variantCodes from './variantCodes';

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
 * Default price for baseCodes missed by pricePerGallonByBaseCode
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

const calculateSalesPrice = (baseCodeId: number, sizeCodeId: number, variantCodeId?: number) => {
	const firstTwoDigitsOfBaseCodeId = Math.floor(baseCodeId / 10);
	const pricePerGallon = pricePerGallonByBaseCode[firstTwoDigitsOfBaseCodeId] ?? defaultPrice;
	const priceMultiplier = (priceMultiplierBySizeCode[sizeCodeId] ?? sizeCodeId) * (variantCodeId && variantCodeId > 1 ? priceMultiplierForPrivateLabel : 1);

	return new Decimal(pricePerGallon * priceMultiplier);
};

/**
 * Generate bulk products for all baseCodes
 */
const bulkProducts: Product[] = baseCodes.map(({ id, name }) => ({
	baseCodeId: id,
	sizeCodeId: 1,
	variantCodeId: 0,
	description: `${name} Bulk`,
	quantityInStock: new Decimal(Math.floor(Math.random() * 10_000)),
	salesPrice: calculateSalesPrice(id, 1, 0)
}));

/**
 * Pailed baseCodes for hydraulic fluids (700s), gear oils (800s), and automatic transmission fluids (900s)
 */
const pailedBaseCodes = baseCodes.filter(({ id }) => [7, 8, 9].includes(Math.floor(id / 100)));

/**
 * Generate "House Brand" pail products
 */
const pailProductsHouseBrand: Product[] = pailedBaseCodes
	.map(({ id, name }) => ({
		baseCodeId: id,
		sizeCodeId: 5,
		variantCodeId: 1,
		description: `"${variantCodes[1]?.name ?? 'House Brand'}" ${name} Pail`,
		quantityInStock: new Decimal(Math.ceil(Math.random() * 10) * 12 * 3), // 1-20 pallets in 12-block x 3-high
		salesPrice: calculateSalesPrice(id, 5, 1)
	}));

/**
 * Generate private label pail products
 */
const pailProductsPrivateLabel: Product[] = pailedBaseCodes
	.map(({ id, name }) => ({
		baseCodeId: id,
		sizeCodeId: 5,
		variantCodeId: 2,
		description: `"${variantCodes[2]?.name ?? 'Private Label'}" ${name} Pail`,
		quantityInStock: new Decimal(Math.ceil(Math.random() * 10) * 12 * 3), // 1-10 pallets in 12-block x 3-high
		salesPrice: calculateSalesPrice(id, 5, 2)
	}));

/**
 * Drummed baseCodes for motor oils (500s & 600s), hydraulic fluids (700s), gear oils (800s), and automatic transmission fluids (900s)
 */
const drummedBaseCodes = baseCodes.filter(({ id }) => [5, 6, 7, 8, 9].includes(Math.floor(id / 100)));

/**
 * Generate "House Brand" drum products
 */
const drumProductsHouseBrand: Product[] = drummedBaseCodes
	.map(({ id, name }) => ({
		baseCodeId: id,
		sizeCodeId: 55,
		variantCodeId: 1,
		description: `"${variantCodes[1]?.name ?? 'House Brand'}" ${name} Drum`,
		quantityInStock: new Decimal(Math.ceil(Math.random() * 10) * 4), // 1-10 pallets in 4-block
		salesPrice: calculateSalesPrice(id, 55, 1)
	}));

/**
 * Generate private label drum products
 */
const drumProductsPrivateLabel: Product[] = drummedBaseCodes
	.map(({ id, name }) => ({
		baseCodeId: id,
		sizeCodeId: 55,
		variantCodeId: 2,
		description: `"${variantCodes[2]?.name ?? 'Private Label'}" ${name} Drum`,
		quantityInStock: new Decimal(Math.ceil(Math.random() * 10) * 4), // 1-5 pallets in 4-block
		salesPrice: calculateSalesPrice(id, 55, 2)
	}));

/**
 * Toted baseCodes for additive packages (300s & 400s), motor oils (500s & 600s), hydraulic fluids (700s), gear oils (800s), and automatic transmission fluids (900s)
 */
const totedBaseCodes = baseCodes.filter(({ id }) => [3, 4, 5, 6, 7, 8, 9].includes(Math.floor(id / 100)));

/**
 * Generate unbranded tote products
 */
const toteProducts: Product[] = totedBaseCodes
	.map(({ id, name }) => {
		const size = Math.round(Math.random()) ? 275 : 330; // 50/50 whether small (275gal) or large (330gal) tote 
		return {
			baseCodeId: id,
			sizeCodeId: size,
			variantCodeId: 0, // N/A (not for distribution; internal production use only)
			description: `${name} Tote (${size}gal)`,
			quantityInStock: new Decimal(Math.floor(Math.random() * 12)), // 0-12
			salesPrice: calculateSalesPrice(id, size, 0)
		};
	});

const products: Product[] = [
	...bulkProducts,
	...pailProductsHouseBrand,
	...pailProductsPrivateLabel,
	...drumProductsHouseBrand,
	...drumProductsPrivateLabel,
	...toteProducts
];

export default products;