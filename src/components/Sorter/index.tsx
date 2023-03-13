import styles from './index.module.css';
import { useState } from 'react';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import type { Dispatch, SetStateAction } from 'react';
import type { SortStateItem } from '@/hooks/useSorter';
import type { DragEventHandler, MouseEventHandler } from 'react';

interface SorterProps<T> {
	sorts: SortStateItem<T>[];
	labels: Map<keyof T, string>;
	moveSort: (fromIndex: number, toIndex: number) => void;
	resetSorts: () => void;
}

function Sorter<T>({ sorts, labels, moveSort, resetSorts }: SorterProps<T>) {
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
							<SortItem
								key={`${String(entry.field)}-${index}`}
								label={labels.get(entry.field) ?? String(entry.field)}
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
}

export default Sorter;

interface SortItemProps {
	label: string;
	index: number;
	dragFromIndex: number | null;
	setDragFromIndex: Dispatch<SetStateAction<number | null>>;
	moveSort: (fromIndex: number, toIndex: number) => void;
}

function SortItem({
	label,
	index,
	dragFromIndex,
	setDragFromIndex,
	moveSort
}: SortItemProps) {
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
			{label}
		</div>
	);
}

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