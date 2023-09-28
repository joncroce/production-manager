import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

export default function FormulaSelector({
	numberOfFormulas,
	selectedFormulaIndex,
	selectPrevious,
	selectNext,
	selectionDisabled
}: {
	numberOfFormulas: number;
	selectedFormulaIndex: number;
	selectPrevious: () => void;
	selectNext: () => void;
	selectionDisabled: boolean;
}): React.JSX.Element {

	return (
		<div className="flex flex-col items-center space-y-2">
			<h2 className="text-3xl font-semibold">Formula</h2>
			<div className="flex justify-center items-center space-x-2">
				<Button
					variant='outline'
					size='icon'
					type="button"
					onClick={selectPrevious}
					disabled={selectionDisabled}
				>
					<ChevronLeftIcon className="h-4 w-4" />
				</Button>

				<span className="text-xl font-mono">
					{selectedFormulaIndex + 1}/{numberOfFormulas}
				</span>

				<Button
					variant='outline'
					size='icon'
					type="button"
					onClick={selectNext}
					disabled={selectionDisabled}
				>
					<ChevronRightIcon className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}