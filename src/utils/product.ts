export function buildProductCode(baseCode: number, sizeCode: number, variantCode: number): string {
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

export function parseProductCode(productCode: string): {
	baseCode: number;
	sizeCode: number;
	variantCode: number;
} {
	const regex = /^(\d{3})-(\d{3})(?:-(\d{3}))?$/;

	if (!regex.test(productCode)) {
		throw new Error('Invalid product code.');
	}

	const matches = regex.exec(productCode)!;
	const baseCode = parseInt(matches[1]!);
	const sizeCode = parseInt(matches[2]!);
	const variantCode = matches[3] ? parseInt(matches[3]) : 0;

	return {
		baseCode,
		sizeCode,
		variantCode
	};
}

export function padCodePart(codePart: number): string {
	return String(codePart).padStart(3, '0');
}