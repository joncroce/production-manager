import styles from './form.module.css';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';

interface Props extends ComponentProps<'input'> {
	name: string;
	label: string;
}

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
	const form = useFormContext();
	const state = form.getFieldState(props.name);

	return (
		<>
			<label className={`${styles.fieldWrapper ?? ''} ${styles.fieldLabel ?? ''}`} htmlFor={props.name}>
				{props.label}
				<input className={styles.input} {...props} id={props.name} ref={ref} />
			</label>
			{state.error && <p>{state.error.message}</p>}
		</>
	);
});

Input.displayName = 'Input';

export default Input;