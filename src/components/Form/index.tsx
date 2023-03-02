import type { ComponentProps } from 'react';
import type {
	FieldValues,
	SubmitHandler,
	UseFormReturn
} from 'react-hook-form';
import {
	FormProvider
} from 'react-hook-form';

interface Props<T extends FieldValues>
	extends Omit<ComponentProps<'form'>, 'onSubmit'> {
	form: UseFormReturn<T>;
	onSubmit: SubmitHandler<T>;
}

const Form = <T extends FieldValues>({
	form,
	onSubmit,
	children,
	...props
}: Props<T>) => (
	<FormProvider {...form}>
		<form onSubmit={form.handleSubmit(onSubmit)} {...props}>
			{children}
		</form>
	</FormProvider>
);

export default Form;