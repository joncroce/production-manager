import formStyles from './index.module.css';
import * as RadixLabel from '@radix-ui/react-label';
import React, { type PropsWithChildren } from 'react';

interface Props {
	htmlFor: string;
}

const Label: React.FC<Props & PropsWithChildren> = ({ htmlFor, children }) =>
	<RadixLabel.Root
		className={formStyles.fieldLabel}
		htmlFor={htmlFor}
	>
		{children}
	</RadixLabel.Root>;

export default Label;