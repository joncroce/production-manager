import styles from './productSorter.module.css';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { labelsByField } from '@/utils/product';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import type { SortStateItem } from '@/hooks/useSorter';
import type { ViewProduct } from '@/schemas/product';
import type { DragEventHandler, MouseEventHandler } from 'react';

const ProductSorter: React.FC<{
	sorts: SortStateItem<ViewProduct>[];
	moveSort: (fromIndex: number, toIndex: number) => void;
	resetSorts: () => void;
}> = ({ sorts, moveSort, resetSorts }) => {
	const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

	return (
		<div className={styles.wrapper}>

			<ResetSortsButton
				disabled={!Boolean(sorts.length)}
				clickHandler={resetSorts}
			/>

			<span>
				Sort order:
			</span>
			{
				sorts.length
					? sorts.map((entry, index) => (
						<>
							<SortEntry
								key={`${entry.field}-${index}`}
								entry={entry}
								index={index}
								dragFromIndex={dragFromIndex}
								setDragFromIndex={setDragFromIndex}
								moveSort={moveSort}
							/>
							{index < sorts.length - 1 && (
								<ArrowRightIcon />
							)}
						</>
					))
					: <span className={styles.noSorts}>No sorting applied.</span>
			}
		</div>
	);
};

export default ProductSorter;

const SortEntry: React.FC<{
	entry: SortStateItem<ViewProduct>;
	index: number;
	dragFromIndex: number | null;
	setDragFromIndex: Dispatch<SetStateAction<number | null>>;
	moveSort: (fromIndex: number, toIndex: number) => void;
}> = ({
	entry,
	index,
	dragFromIndex,
	setDragFromIndex,
	moveSort
}) => {
		const handleDragStart: DragEventHandler = () => {
			setDragFromIndex(index);
		};
		const handleDragEnd: DragEventHandler = (e) => {
			setDragFromIndex(null);
			e.currentTarget.setAttribute('data-dragged-over-from', 'none');
		};

		const handleDragEnter: DragEventHandler = (e) => {
			e.currentTarget.setAttribute('data-dragged-over-from',
				dragFromIndex !== null && dragFromIndex !== index
					? dragFromIndex > index
						? 'after'
						: 'before'
					: 'none'
			);
		};

		const handleDragLeave: DragEventHandler = (e) => {
			e.currentTarget.setAttribute('data-dragged-over-from', 'none');
		};

		const handleDragOver: DragEventHandler = (e) => {
			e.preventDefault();
			return false;
		};

		const handleDrop: DragEventHandler = (e) => {
			e.stopPropagation();
			if (dragFromIndex !== null) {
				console.log(`from: ${dragFromIndex}, to: ${index}`);
				moveSort(dragFromIndex, index);
				setDragFromIndex(null);
			}
		};

		return (
			<div
				className={styles.sortEntry}
				draggable
				data-dragging={index === dragFromIndex}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				{labelsByField.get(entry.field)}
			</div>
		);
	};

const ResetSortsButton: React.FC<{
	disabled: boolean;
	clickHandler: MouseEventHandler;
}> = ({
	disabled,
	clickHandler
}) => (
		<button
			type="button"
			disabled={disabled}
			aria-disabled={disabled}
			className={styles.resetSorts}
			onClick={clickHandler}
		>
			Reset
		</button>
	);