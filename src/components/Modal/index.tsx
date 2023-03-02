import styles from './index.module.css';
import * as Dialog from '@radix-ui/react-dialog';
import type { Dispatch, MutableRefObject, PropsWithChildren, SetStateAction } from 'react';

interface Props {
	title?: string;
	open: boolean;
	onOpenChange: Dispatch<SetStateAction<boolean>>;
	containerRef: MutableRefObject<HTMLElement | null>;
}

const Modal: React.FC<Props & PropsWithChildren> = ({ title, open, onOpenChange, children, containerRef }) => {
	return (
		<>
			<Dialog.Root open={open} onOpenChange={onOpenChange}>
				<Dialog.Portal container={containerRef.current}>
					<Dialog.Overlay className={styles.dialogOverlay}>
						<Dialog.Content className={styles.dialogContent}>
							<Dialog.Title className={styles.dialogTitle}>{title}</Dialog.Title>
							{children}
						</Dialog.Content>
					</Dialog.Overlay>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
};

export default Modal;