import styles from './form.module.css';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<'button'>, 'type'>;

const SubmitButton = (props: Props) => <button className={styles.submitButton} {...props} type="submit" />;

export default SubmitButton;