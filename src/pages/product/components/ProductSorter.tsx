import styles from './productSorter.module.css';
import { labelsByField } from '@/utils/product';
import ArrowRightIcon from './Icons/ArrowRightIcon';
import type { SortStateEntry } from '@/hooks/useProductSorter';
import type { MouseEventHandler } from 'react';

const ProductSorter: React.FC<{
	sorts: SortStateEntry[];
	resetSorts: () => void;
}> = ({ sorts, resetSorts }) => {

	return (
		<div className={styles.wrapper}>
			{
				sorts.length
					? <ResetSorts clickHandler={resetSorts} />
					: null
			}
			<span>
				Sorting by:
			</span>
			{
				sorts.length
					? sorts.map((entry, index) => (
						<>
							<SortEntry
								key={`${entry.field}-${index}`}
								entry={entry}
							/>
							{index < sorts.length - 1 && (
								<ArrowRightIcon />
							)}
						</>
					))
					: <span className={styles.noSorts}>None</span>
			}
		</div>
	);
};

export default ProductSorter;

const SortEntry: React.FC<{
	entry: SortStateEntry;
}> = ({
	entry
}) => (
		<div className={styles.sortEntryWrapper}>
			<span className={styles.sortEntryField}>{labelsByField.get(entry.field)}</span>
		</div>
	);

const ResetSorts: React.FC<{ clickHandler: MouseEventHandler; }> = ({
	clickHandler
}) => <button type="button" className={styles.resetSorts} onClick={clickHandler}>Reset</button>;