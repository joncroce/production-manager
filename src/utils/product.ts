import type { Product } from '@prisma/client';
import type { ViewProduct } from '@/schemas/product';

export type FormattedProduct = Map<keyof ViewProduct, string>;

export const labelsByField = new Map<keyof ViewProduct, string>(
	[
		['code', 'Code'],
		['baseCodeId', 'BaseId'],
		['sizeCodeId', 'SizeId'],
		['variantCodeId', 'VariantId'],
		['quantityInStock', 'Quantity'],
		['salesPrice', 'Price'],
		['description', 'Description'],
	]
);

export const formatForView =
	(
		{
			code,
			baseCodeId,
			sizeCodeId,
			variantCodeId,
			quantityInStock,
			salesPrice,
			description
		}: ViewProduct
	): FormattedProduct =>
		new Map(
			[
				['code', code],
				['baseCodeId', String(baseCodeId)],
				['sizeCodeId', String(sizeCodeId)],
				['variantCodeId', variantCodeId === 0 ? 'N/A' : String(variantCodeId)],
				['quantityInStock', String(quantityInStock)],
				['salesPrice', Number.parseFloat(salesPrice.toString()).toFixed(2)],
				['description', description],
			]
		);

export const addProductCode = (product: Product): ViewProduct => {
	const { baseCodeId, sizeCodeId, variantCodeId } = product;
	return {
		code: formatProductCode(baseCodeId, sizeCodeId, variantCodeId),
		baseCodeId,
		sizeCodeId,
		variantCodeId,
		quantityInStock: Number(product.quantityInStock ?? 0),
		salesPrice: Number(product.salesPrice ?? 0),
		description: String(product.description ?? ''),
	};
};

const formatProductCode = (baseCode: number, sizeCode: number, variantCode: number) => {
	const baseCodeString = String(baseCode).padStart(3, '0');
	const sizeCodeString = sizeCode === 0 ? '' : String(sizeCode).padStart(3, '0');
	const variantCodeString = variantCode === 0 ? '' : String(variantCode).padStart(3, '0');

	return [
		baseCodeString,
		sizeCodeString,
		variantCodeString
	].filter(s => s.length)
		.join('-');
};