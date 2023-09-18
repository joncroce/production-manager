export const buildProductCode = (baseCode: number, sizeCode: number, variantCode: number) => {
	const baseCodeString = padCodePart(baseCode);
	const sizeCodeString = sizeCode === 0 ? '' : padCodePart(sizeCode);
	const variantCodeString = variantCode === 0 ? '' : padCodePart(variantCode);

	return [
		baseCodeString,
		sizeCodeString,
		variantCodeString
	].filter(s => s.length)
		.join('-');
};

export function padCodePart(codePart: number): string {
	return String(codePart).padStart(3, '0');
}