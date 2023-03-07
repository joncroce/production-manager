import styles from './productInventory.module.css';
import { labelsByField } from '@/utils/product';
import DescendingAlphabeticicIcon from './Icons/DescendingAlphabeticIcon';
import AscendingAlphabeticIcon from './Icons/AscendingAlphabeticIcon';
import DescendingNumericIcon from './Icons/DescendingNumericIcon';
import AscendingNumericIcon from './Icons/AscendingNumericIcon';
import type { MouseEventHandler, PropsWithChildren } from 'react';
import type { FormattedProduct } from '@/utils/product';
import type { SortStateEntry } from '@/hooks/useProductSorter';

const ProductInventoryTable: React.FC<{
	products: FormattedProduct[];
	sorts: SortStateEntry[];
	addSort: (entry: SortStateEntry) => void;
	removeSort: (index: number) => void;
	reverseSortDirection: (index: number) => void;
}> = ({
	products,
	sorts,
	addSort,
	removeSort,
	reverseSortDirection
}) => {
		if (!products.length) {
			return <span>No Products</span>;
		}

		return (
			<table className={styles.table}>
				<thead className={styles.thead}>
					<tr className={styles.tr}>
						<th className={styles.th}>
						</th>
						{
							[...labelsByField.entries()].map(([fieldName, labelText]) => (
								<th key={fieldName} className={`${styles[`th_${fieldName}`] ?? ''} ${styles.th ?? ''}`}>
									<ToggleSortFieldButton
										key={fieldName}
										sortingBy={Boolean(sorts.find(sort => sort.field === fieldName))}
										handleClick={
											(() => {
												const index = sorts.findIndex(sort => sort.field === fieldName);
												return index !== -1
													? () => removeSort(index)
													: () => addSort({ field: fieldName, direction: 'asc' });
											})()
										}
									>
										{labelText}
									</ToggleSortFieldButton>
									<button
										className={styles.toggleDirection}
										onClick={() => reverseSortDirection(sorts.findIndex(sort => sort.field === fieldName))}
									>
										{
											(() => {
												const sortBy = sorts.find(sort => sort.field === fieldName);
												if (!Boolean(sortBy)) return <></>;
												if ([
													'code', 'description'
												].includes(fieldName)) {
													return sortBy?.direction === 'desc'
														? <DescendingAlphabeticicIcon />
														: <AscendingAlphabeticIcon />;
												} else {
													return sortBy?.direction === 'desc'
														? <DescendingNumericIcon />
														: <AscendingNumericIcon />;
												}
											})()
										}
									</button>
								</th>
							))
						}
					</tr>
				</thead>
				<tbody className={styles.tbody}>
					{
						products.map((product, index) => (
							<tr key={product.get('code')} className={styles.tr}>
								<td className={`${styles.td ?? ''} ${styles.td_index ?? ''}`}>{index + 1}</td>
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

export default ProductInventoryTable;

const ToggleSortFieldButton: React.FC<
	PropsWithChildren &
	{
		handleClick: MouseEventHandler;
		sortingBy: boolean;
	}
> = (
	{ handleClick, sortingBy, children }
) => (
		<button
			className={styles.toggleSortFieldButton}
			type="button"
			data-sorting-by={sortingBy}
			onClick={handleClick}
		>
			{children}
		</button>
	);