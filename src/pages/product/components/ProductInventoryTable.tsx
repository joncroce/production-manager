import styles from './productInventoryTable.module.css';
import type { Product } from '@prisma/client';

interface Props {
	products: Product[];
}

interface ProductView extends Product {
	code: string;
}

const productLabelsByAttribute = new Map<keyof ProductView, string>(
	[
		['code', 'Code'],
		['baseCodeId', 'Base Code'],
		['sizeCodeId', 'Size Code'],
		['variantCodeId', 'Variant Code'],
		['quantityInStock', 'Quantity'],
		['salesPrice', 'Price'],
		['description', 'Description'],
	]
);

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

const formatProduct =
	(
		{
			baseCodeId,
			sizeCodeId,
			variantCodeId,
			quantityInStock,
			salesPrice,
			description
		}: Product
	): Map<keyof ProductView, string> =>
		new Map(
			[
				['code', formatProductCode(baseCodeId, sizeCodeId, variantCodeId)],
				['baseCodeId', String(baseCodeId)],
				['sizeCodeId', String(sizeCodeId)],
				['variantCodeId', variantCodeId === 0 ? 'N/A' : String(variantCodeId)],
				['quantityInStock', String(quantityInStock)],
				['salesPrice', salesPrice ? Number.parseFloat(salesPrice.toString()).toFixed(2) : ''],
				['description', description ?? ''],
			]
		);

const ProductList: React.FC<Props> = ({ products }) => {

	const productsForView = products.map(formatProduct);

	return (
		<table className={styles.table}>
			<caption className={styles.caption}>Product Inventory</caption>
			<thead>
				<tr>
					{
						[...productLabelsByAttribute.entries()].map(([k, v]) => (
							<th key={k} className={`${styles[`th_${k}`] ?? ''} ${styles.th ?? ''}`}>{v}</th>
						))
					}
				</tr>
			</thead>
			<tbody>
				{
					productsForView.map((product) => (
						<tr key={product.get('code')}>
							{
								[...product.entries()].map(([k, v]) => (
									<td key={product.get('code')?.concat(String(k))} className={`${styles[`td_${k}`] ?? ''} ${styles.td ?? ''}`}>{v}</td>
								))
							}
						</tr>
					))
				}
			</tbody>
		</table>
	);
};

export default ProductList;