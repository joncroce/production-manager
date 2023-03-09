import styles from '@/components/Form/index.module.css';
import schema from '@/schemas/code';
import { Close as ModalCloseButton } from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useZodForm } from '@/hooks/useZodForm';
import { api } from '@/utils/api';
import Form from '@/components/Form';
import Input from '@/components/Form/Input';
import SubmitButton from '@/components/Form/SubmitButton';
import type { ProductBaseCode, ProductSizeCode, ProductVariantCode } from '@prisma/client';

interface Props {
	codeName: 'baseCode' | 'sizeCode' | 'variantCode';
	closeModal: () => void;
	onMutationSuccess: (((data: ProductBaseCode, variables: {
		description?: string | undefined;
		name: string;
		id: number;
	}, context: unknown) => unknown) & ((data: ProductSizeCode, variables: {
		description?: string | undefined;
		name: string;
		id: number;
	}, context: unknown) => unknown) & ((data: ProductVariantCode, variables: {
		description?: string | undefined;
		name: string;
		id: number;
	}, context: unknown) => unknown)) | undefined;
}

const AddCodeModalForm: React.FC<Props> = ({ codeName, onMutationSuccess, closeModal }) => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const form = useZodForm({ schema });

	const createMutation = api[codeName].add.useMutation({
		onSuccess: onMutationSuccess,
		onError(error) {
			console.error(error);
			setErrorMessage(error.message);
		},
	});

	return (
		<Form form={form} onSubmit={(data) => {
			try {
				createMutation.mutate(data);
			} catch (error) {
				console.error(error);
				setErrorMessage((error as { message?: string; })?.message ?? 'Unknown Error');
			}
		}}>
			<fieldset className={styles.fieldset} disabled={form.formState.isSubmitting}>
				<Input type="text" label="Id" autoComplete="off" required {...form.register('id')} />
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

export default AddCodeModalForm;