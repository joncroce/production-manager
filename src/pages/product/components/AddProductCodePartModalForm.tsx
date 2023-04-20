import styles from '@/components/Form/index.module.css';
import { addProductCodePartSchema, type TAddProductCodePartSchema } from '@/schemas/product';
import { Close as ModalCloseButton } from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useZodForm } from '@/hooks/useZodForm';
import { api } from '@/utils/api';
import Form from '@/components/Form';
import Input from '@/components/Form/Input';
import SubmitButton from '@/components/Form/SubmitButton';
import type { ModalFormSuccessData } from './AddProductForm';
import type { SubmitHandler } from 'react-hook-form';

interface Props {
	factoryId: string;
	codePart: 'productBase' | 'productSize' | 'productVariant';
	closeModal: () => void;
	onMutationSuccess: (data: ModalFormSuccessData) => Promise<void>;
}

const AddProductCodePartModalForm: React.FC<Props> = ({ factoryId, codePart, onMutationSuccess, closeModal }) => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const defaultFormValues = {
		code: '',
		name: '',
		description: '',
		factoryId: factoryId
	};

	const form = useZodForm({
		schema: addProductCodePartSchema,
		// @ts-expect-error string inputs coerced to number
		defaultValues: defaultFormValues,
		resetOptions: {
			keepDefaultValues: true
		}
	});

	const addProductCodePart = api[codePart].add.useMutation({
		onSuccess: onMutationSuccess,
		onError(error) {
			console.error(error);
			setErrorMessage(error.message);
		},
	});

	const handleSubmit: SubmitHandler<TAddProductCodePartSchema> = (data) => {
		addProductCodePart.mutate(data);
	};

	return (
		<Form form={form} onSubmit={handleSubmit}>
			<fieldset className={styles.fieldset} disabled={form.formState.isSubmitting}>
				<Input type="text" label="Code" autoComplete="off" required {...form.register('code')} />
				<Input type="text" label="Name" autoComplete="off" required {...form.register('name')} />
				<Input type="text" label="Description" autoComplete="off"  {...form.register('description')} />
			</fieldset>
			<div className={styles.buttonRow}>
				<ModalCloseButton className={styles.cancelButton} onClick={closeModal}>Cancel</ModalCloseButton>
				<SubmitButton>Submit</SubmitButton>
			</div>
			<div className={styles.errorMessage}>{errorMessage}</div>
		</Form>
	);
};

export default AddProductCodePartModalForm;