import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const Timestamp: React.FC<{ time: Date; label: string; }> = ({ time, label }) => {
	const relative = dayjs().to(time);
	const localized = dayjs(time).format('LLLL');

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>
					<div className="flex justify-center items-baseline space-x-1">
						<span className="font-bold">{label}:</span>
						<span className="font-semibold">{relative}</span>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					{localized}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default Timestamp;