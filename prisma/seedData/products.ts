import type { Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import baseCodes from './baseCodes';
import variantCodes from './variantCodes';

/**
 * Uses the first 2 digits of the base code to determine cost.
 */
const pricePerGallonByBaseCode: { [K in number]: number } = {
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
 * Note: Bulk (sizeCode 11) is omitted as Bulk quantity is specified in gallons so multiplier is 1
 * 
 */
const priceMultiplierBySizeCode = {
	5: 8,
	55: 62,
	275: 300,
	330: 360
};

/**
 * Price multiplier for non-"House Brand" product variants.
 */
const priceMultiplierForPrivateLabel = 1.05;

/**
 * Generate bulk products for all baseCodes
 */
const bulkProducts: Product[] = baseCodes.map(({ id, name }) => ({
	baseCodeId: id,
	sizeCodeId: 11,
	variantCodeId: 0,
	description: `${name} Bulk`,
	quantityInStock: new Decimal(Math.floor(Math.random() * 10_000)),
	salesPrice: new Decimal(pricePerGallonByBaseCode[Math.floor(id / 10)] ?? defaultPrice)
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
		salesPrice: new Decimal(pricePerGallonByBaseCode[Math.floor(id / 10)] ?? defaultPrice * priceMultiplierBySizeCode[5])
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
		salesPrice: new Decimal(pricePerGallonByBaseCode[Math.floor(id / 10)] ?? defaultPrice * priceMultiplierBySizeCode[5] * priceMultiplierForPrivateLabel)
	}));

/**
 * Generate "House Brand" drum products
 */
const drumProductsHouseBrand: Product[] = baseCodes
	.map(({ id, name }) => ({
		baseCodeId: id,
		sizeCodeId: 55,
		variantCodeId: 1,
		description: `"${variantCodes[1]?.name ?? 'House Brand'}" ${name} Drum`,
		quantityInStock: new Decimal(Math.ceil(Math.random() * 10) * 4), // 1-10 pallets in 4-block
		salesPrice: new Decimal(pricePerGallonByBaseCode[Math.floor(id / 10)] ?? defaultPrice * priceMultiplierBySizeCode[55])
	}));

/**
 * Generate private label drum products
 */
const drumProductsPrivateLabel: Product[] = baseCodes
	.map(({ id, name }) => ({
		baseCodeId: id,
		sizeCodeId: 55,
		variantCodeId: 2,
		description: `"${variantCodes[2]?.name ?? 'Private Label'}" ${name} Drum`,
		quantityInStock: new Decimal(Math.ceil(Math.random() * 10) * 4), // 1-5 pallets in 4-block
		salesPrice: new Decimal(pricePerGallonByBaseCode[Math.floor(id / 10)] ?? defaultPrice * priceMultiplierBySizeCode[55])
	}));

/**
 * Generate unbranded tote products
 */
const toteProducts: Product[] = baseCodes
	.map(({ id, name }) => {
		const size = Math.round(Math.random()) ? 275 : 330; // 50/50 whether small (275gal) or large (330gal) tote 
		return {
			baseCodeId: id,
			sizeCodeId: size,
			variantCodeId: 0, // N/A (not for distribution; internal production use only)
			description: `${name} Tote (${size}gal)`,
			quantityInStock: new Decimal(Math.floor(Math.random() * 12)), // 0-12
			salesPrice: new Decimal(pricePerGallonByBaseCode[Math.floor(id / 10)] ?? defaultPrice * priceMultiplierBySizeCode[size])
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