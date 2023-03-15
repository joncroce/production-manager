import styles from './index.module.css';
import DescendingAlphabeticicIcon from '@/components/Icons/DescendingAlphabeticIcon';
import AscendingAlphabeticIcon from '@/components/Icons/AscendingAlphabeticIcon';
import DescendingNumericIcon from '@/components/Icons/DescendingNumericIcon';
import AscendingNumericIcon from '@/components/Icons/AscendingNumericIcon';
import type { MouseEventHandler, PropsWithChildren } from 'react';
import { nanoid } from 'nanoid';
import useSorter from '@/hooks/useSorter';
import Sorter from '../Sorter';

export type SortType = 'alphabetic' | 'numeric';

interface SortableTableProps<T> {
	items: T[];
	itemLabel: string;
	fieldLabels: Map<keyof T & string, string>;
	fieldSortTypes: Map<keyof T & string, SortType>;
	formatter: (item: T) => Map<keyof T & string, string>;
}

function SortableDataTable<T>({
	items,
	itemLabel,
	fieldLabels,
	fieldSortTypes,
	formatter,
}: SortableTableProps<T>) {
	const { addSort, removeSort, moveSort, reverseSortDirection, resetSorts, getSorts, performSorts } = useSorter<T>();

	if (!items.length) {
		return <span>No {itemLabel ?? 'Item'}s</span>;
	}

	const sorts = getSorts();

	return (
		<>
			<Sorter<T>
				sorts={sorts}
				labels={fieldLabels}
				moveSort={moveSort}
				resetSorts={resetSorts}
			/>
			<table className={styles.table} style={{ gridTemplateColumns: `repeat(${fieldLabels.size}, 1fr)` }}>
				<thead className={styles.thead}>
					<tr className={styles.tr}>
						{
							[...fieldLabels.entries()].map(([fieldName, labelText]) => (
								<th key={String(fieldName)} className={styles.th}>
									<ToggleSortFieldButton
										key={String(fieldName)}
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
												const sortType = fieldSortTypes.get(fieldName) ?? 'alphabetic';
												if (sortType === 'numeric') {
													return sortBy?.direction === 'desc'
														? <DescendingNumericIcon />
														: <AscendingNumericIcon />;
												} else {
													return sortBy?.direction === 'desc'
														? <DescendingAlphabeticicIcon />
														: <AscendingAlphabeticIcon />;
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
						[...items].sort(performSorts).map(formatter).map((item) => (
							<tr key={nanoid(6)} className={styles.tr}>
								{
									[...item.entries()].map(([/* k */, v]) => (
										<td key={nanoid(6)} className={styles.td}>{v}</td>
									))
								}
							</tr>
						))
					}
				</tbody>
			</table>
		</>
	);
}

export default SortableDataTable;

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