import styles from '../add.module.css';
import formStyles from '@/components/Form/index.module.css';
import { useState } from 'react';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import schema from '@/schemas/product';
import Form from '@/components/Form';
import Input from '@/components/Form/Input';
import Modal from '@/components/Modal';
import SubmitButton from '@/components/Form/SubmitButton';
import ControlledSelect from '@/components/Form/ControlledSelect';
import AddCodeModalForm from './AddCodeModalForm';
import type { MutableRefObject, PropsWithChildren, MouseEventHandler } from 'react';
import type { ProductBaseCode, ProductSizeCode, ProductVariantCode } from '@prisma/client';
import type { SubmitHandler } from 'react-hook-form';
import type { z } from 'zod';

type ModalFormSuccessData = ProductBaseCode | ProductSizeCode | ProductVariantCode;
type ModalFormCodeName = 'baseCode' | 'sizeCode' | 'variantCode';
type FieldDataByCodeName = Record<
	ModalFormCodeName,
	{
		fieldName: 'baseCodeId' | 'sizeCodeId' | 'variantCodeId';
		label: string;
		queryData: ProductBaseCode[] | ProductSizeCode[] | ProductVariantCode[] | undefined;
	}
>;

interface Props {
	containerRef: MutableRefObject<HTMLElement | null>;
}
const AddProductForm: React.FC<Props> = ({ containerRef }) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalFormCodeName, setModalFormCodeName] = useState<ModalFormCodeName | undefined>(undefined);
	const [modalFormTitle, setModalFormTitle] = useState<string>('');

	/** Needed to revert select fields to show placeholder on form reset 
	 *  https://github.com/radix-ui/primitives/issues/1569
	**/
	const [keyForReset, setKeyForReset] = useState<number>(0);

	const form = useZodForm({ schema });

	const availableBaseCodes = api.baseCode.getAll.useQuery(undefined, { refetchOnWindowFocus: false });
	const availableSizeCodes = api.sizeCode.getAll.useQuery(undefined, { refetchOnWindowFocus: false });
	const availableVariantCodes = api.variantCode.getAll.useQuery(undefined, { refetchOnWindowFocus: false });

	type ModalFormQueryResult = typeof availableBaseCodes | typeof availableSizeCodes | typeof availableVariantCodes;

	const fieldDataByCodeName: FieldDataByCodeName = {
		'baseCode': {
			fieldName: 'baseCodeId',
			label: 'Base Code',
			queryData: availableBaseCodes.data,
		},
		'sizeCode': {
			fieldName: 'sizeCodeId',
			label: 'Size Code',
			queryData: availableSizeCodes.data,
		},
		'variantCode': {
			fieldName: 'variantCodeId',
			label: 'Variant Code',
			queryData: availableVariantCodes.data
		}
	};

	const getQueryResultByCodeName = (codeName: ModalFormCodeName) => {
		switch (codeName) {
			case 'baseCode': return availableBaseCodes;
			case 'sizeCode': return availableSizeCodes;
			case 'variantCode': return availableVariantCodes;
			default: throw new Error('Invalid Code Name');
		}
	};

	const openModal = (name: ModalFormCodeName) => {
		setModalFormCodeName(name);
		setModalFormTitle(() => {
			switch (name) {
				case 'baseCode': return 'Add Base Code';
				case 'sizeCode': return 'Add Size Code';
				case 'variantCode': return 'Add Variant Code';
				default: return '';
			}
		});
		setModalOpen(true);
	};

	const closeModal = () => {
		setModalOpen(false);
	};

	const setFieldValueByCodeName = (codeName: ModalFormCodeName, value: number) => {
		form.setValue(fieldDataByCodeName[codeName].fieldName, value);
	};

	const modalFormMutationSuccessHandler =
		(queryResult: ModalFormQueryResult) =>
			async (data: ModalFormSuccessData) => {
				if (queryResult) {
					await queryResult.refetch();
					if (modalFormCodeName) {
						setFieldValueByCodeName(modalFormCodeName, data.id);
					}
					closeModal();
				}
			};

	const addProduct = api.products.add.useMutation({
		onSuccess(data) {
			console.log(data);
			alert(`Successfully created new product ${String(data.baseCodeId).padStart(3, '0')}-${String(data.sizeCodeId).padStart(2, '0')}-${String(data.variantCodeId).padStart(2, '0')}`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Something went wrong: ${error.message}`);
		},
	});

	const submitForm: SubmitHandler<z.infer<typeof schema>> = (data) => { addProduct.mutate(data); };
	const resetForm = () => {
		form.reset();
		setKeyForReset((n) => n + 1);
	};

	return (
		<div className={styles.formWrapper}>
			<Form form={form} onSubmit={submitForm}>
				<CodeFields fieldDataByCodeName={fieldDataByCodeName} openModal={openModal} keyForReset={String(keyForReset)} />
				<Input type="string" label="Description" autoComplete="off"  {...form.register('description')} />
				<Input type="string" label="Quantity in Stock" autoComplete="off"  {...form.register('quantityInStock')} />
				<Input type="string" label="Sales Price" autoComplete="off"  {...form.register('salesPrice')} />
				<div className={formStyles.buttonRow}>
					<ResetButton clickHandler={resetForm} />
					<SubmitButton>Submit</SubmitButton>
				</div>
			</Form >
			<Modal
				open={modalOpen}
				onOpenChange={setModalOpen}
				containerRef={containerRef}
				title={modalFormTitle}
			>
				{
					modalFormCodeName &&
					<AddCodeModalForm
						codeName={modalFormCodeName}
						closeModal={closeModal}
						onMutationSuccess={modalFormMutationSuccessHandler(getQueryResultByCodeName(modalFormCodeName))}
					/>
				}
			</Modal>
		</div >
	);
};

export default AddProductForm;

const FieldRow: React.FC<PropsWithChildren> = ({ children }) => (
	<div className={formStyles.fieldRow}>{children}</div>
);

const CodeFields: React.FC<{
	fieldDataByCodeName: FieldDataByCodeName;
	openModal: (codeName: ModalFormCodeName) => void;
	keyForReset: string;
}> = ({
	fieldDataByCodeName,
	openModal,
	keyForReset
}) =>
		<>
			{
				(Object.keys(fieldDataByCodeName) as ModalFormCodeName[])
					.map(
						(codeName) => {
							const { fieldName, label, queryData } = fieldDataByCodeName[codeName];

							return (
								<FieldRow key={`${codeName}-${keyForReset}`}>
									<ControlledSelect
										labelText={label}
										fieldName={fieldName}
										required
										disabled={!queryData?.length}
										items={queryData ?? []}
									/>
									<AddCodeButton clickHandler={() => openModal(codeName)} />
								</FieldRow>
							);
						}
					)
			}
		</>;

const AddCodeButton: React.FC<{ clickHandler: MouseEventHandler<HTMLButtonElement>; }> = ({ clickHandler }) => {
	return (
		<button
			className={formStyles.addButton}
			type="button"
			onClick={clickHandler}
		>
			+ Add New
		</button>
	);
};

const ResetButton: React.FC<{ clickHandler: MouseEventHandler; }> = ({ clickHandler }) => (
	<button className={formStyles.resetButton} type="button" onClick={clickHandler}>Reset</button>
);
