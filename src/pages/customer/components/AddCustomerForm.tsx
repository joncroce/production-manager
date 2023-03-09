import styles from './addCustomerForm.module.css';
import formStyles from '@/components/Form/index.module.css';
import Form from '@/components/Form';
import Input from '@/components/Form/Input';
import { useZodForm } from '@/hooks/useZodForm';
import { addCustomerSchema } from '@/schemas/customer';
import { api } from '@/utils/api';
import type { SubmitHandler } from 'react-hook-form'; import type { z } from 'zod';
import SubmitButton from '@/components/Form/SubmitButton';
import type { MouseEventHandler } from 'react';

const AddCustomerForm: React.FC = () => {
	const form = useZodForm({ schema: addCustomerSchema });

	const addCustomer = api.customers.add.useMutation({
		onSuccess(data) {
			alert(`Successfully created new Customer "${data.name}"`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Error: ${error.message}`);
		}
	});

	const submitForm: SubmitHandler<z.infer<typeof addCustomerSchema>> = (data) => {
		addCustomer.mutate(data);
	};

	const resetForm = () => {
		form.reset();
	};

	return (
		<Form form={form} onSubmit={submitForm}>
			<Input type="string" label="Name" autoComplete="off" {...form.register('name')} />
			<fieldset className={formStyles.fieldset}>
				<legend className={formStyles.legend}>Billing Address</legend>
				<Input type="string" label="Street Address Line 1" autoComplete="off" {...form.register('DefaultBillingAddress.streetLine1')} />
				<Input type="string" label="Street Address Line 2 (optional)" autoComplete="off" {...form.register('DefaultBillingAddress.streetLine2')} />
				<Input type="string" label="City" autoComplete="off" {...form.register('DefaultBillingAddress.city')} />
				<Input type="string" label="ZIP" autoComplete="off" {...form.register('DefaultBillingAddress.zip')} />
			</fieldset>
			<fieldset className={formStyles.fieldset}>
				<legend className={formStyles.legend}>Shipping Address</legend>
				<Input type="string" label="Street Address Line 1" autoComplete="off" {...form.register('DefaultShippingAddress.streetLine1')} />
				<Input type="string" label="Street Address Line 2 (optional)" autoComplete="off" {...form.register('DefaultShippingAddress.streetLine2')} />
				<Input type="string" label="City" autoComplete="off" {...form.register('DefaultShippingAddress.city')} />
				<Input type="string" label="ZIP" autoComplete="off" {...form.register('DefaultShippingAddress.zip')} />
			</fieldset>
			<div className={formStyles.buttonRow}>
				<ResetButton clickHandler={resetForm} />
				<SubmitButton>Submit</SubmitButton>
			</div>
		</Form>
	);
};

export default AddCustomerForm;

const ResetButton: React.FC<{ clickHandler: MouseEventHandler; }> = ({ clickHandler }) => (
	<button className={formStyles.resetButton} type="button" onClick={clickHandler}>Reset</button>
);
