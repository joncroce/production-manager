import styles from '@/components/Form/index.module.css';
import * as Select from '@radix-ui/react-select';
import type { PropsWithChildren } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import Label from './Label';

interface Props {
	labelText: string;
	fieldName: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	items: {
		id: number | string;
		name: string;
	}[];
}

const ControlledSelect: React.FC<Props & PropsWithChildren> = ({ labelText, fieldName, placeholder, disabled, required, items }) => {
	const form = useFormContext();

	return (
		<Controller
			name={fieldName}
			control={form.control}
			render={({ field }) => (

				<Label htmlFor={fieldName}>
					{labelText}
					<Select.Root
						required={required}
						disabled={disabled}
						value={field.value as string}
						onValueChange={(val) => form.setValue(fieldName, Number(val))}
					>
						<Select.Trigger className={styles.selectTrigger}>
							<Select.Value
								className={styles.selectValue}
								placeholder={placeholder ?? "Select"}
								aria-label={String(field.value)}
							>
								{typeof field.value === 'number' ? String(field.value) : null}
							</Select.Value>
							<Select.Icon className={styles.selectIcon} />
						</Select.Trigger>
						<Select.Portal>
							<Select.Content className={styles.selectContent}>
								<Select.ScrollUpButton className={styles.scrollButton}>
									<ChevronUpIcon />
								</Select.ScrollUpButton>
								<Select.Viewport className={styles.selectViewport}>
									{
										items.map(({ id, name }) =>
											<Select.Item key={id} value={String(id)} className={styles.selectItem}>
												<Select.ItemText>{`${id}: ${name}`}</Select.ItemText>
											</Select.Item>
										)
									}
								</Select.Viewport>
								<Select.ScrollDownButton className={styles.scrollButton}>
									<ChevronDownIcon />
								</Select.ScrollDownButton>
							</Select.Content>
						</Select.Portal>
					</Select.Root>
				</Label>
			)}
		/>
	);
};

export default ControlledSelect;