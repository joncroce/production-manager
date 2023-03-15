export const buildProductCode = (baseCode: number, sizeCode: number, variantCode: number) => {
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