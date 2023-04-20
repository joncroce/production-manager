import styles from '../add.module.css';
import formStyles from '@/components/Form/index.module.css';
import Form from '@/components/Form';
import Input from '@/components/Form/Input';
import Modal from '@/components/Modal';
import SubmitButton from '@/components/Form/SubmitButton';
import ProductCodePartSelect from '@/components/Form/ProductCodePartSelect';
import AddProductCodePartModalForm from './AddProductCodePartModalForm';
import { useState } from 'react';
import { api } from '@/utils/api';
import { addProductSchema, type TAddProductSchema } from '@/schemas/product';
import { buildProductCode } from '@/utils/product';
import { useZodForm } from '@/hooks/useZodForm';
import type { SubmitHandler } from 'react-hook-form';
import type { MutableRefObject, PropsWithChildren, MouseEventHandler } from 'react';
import type {
	ProductBase as TProductBase,
	ProductSize as TProductSize,
	ProductVariant as TProductVariant
} from '@prisma/client';

export type ModalFormSuccessData = TProductBase | TProductSize | TProductVariant;
type ModalFormCodePart = 'productBase' | 'productSize' | 'productVariant';
type FieldDataByCodeName = Record<
	ModalFormCodePart,
	{
		fieldName: 'baseCode' | 'sizeCode' | 'variantCode';
		label: string;
		queryData: TProductBase[] | TProductSize[] | TProductVariant[] | undefined;
	}
>;

interface Props {
	factoryId: string;
	containerRef: MutableRefObject<HTMLElement | null>;
}
const AddProductForm: React.FC<Props> = ({ factoryId, containerRef }) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [modalFormCodePart, setModalFormCodePart] = useState<ModalFormCodePart | undefined>(undefined);
	const [modalFormTitle, setModalFormTitle] = useState<string>('');

	/** Needed to revert select fields to show placeholder on form reset 
	 *  https://github.com/radix-ui/primitives/issues/1569
	**/
	const [keyForReset, setKeyForReset] = useState<number>(0);

	const form = useZodForm({
		schema: addProductSchema,
		defaultValues: {
			baseCode: undefined,
			sizeCode: undefined,
			variantCode: undefined,
			factoryId: factoryId,
			description: ''
		},
		resetOptions: {
			keepDefaultValues: true
		}
	});

	const availableProductBases = api.productBase.getAll.useQuery(undefined, { refetchOnWindowFocus: false });
	const availableProductSizes = api.productSize.getAll.useQuery(undefined, { refetchOnWindowFocus: false });
	const availableProductVariants = api.productVariant.getAll.useQuery(undefined, { refetchOnWindowFocus: false });

	type ModalFormQueryResult = typeof availableProductBases | typeof availableProductSizes | typeof availableProductVariants;

	const fieldDataByCodeName: FieldDataByCodeName = {
		'productBase': {
			fieldName: 'baseCode',
			label: 'Base Code',
			queryData: availableProductBases.data,
		},
		'productSize': {
			fieldName: 'sizeCode',
			label: 'Size Code',
			queryData: availableProductSizes.data,
		},
		'productVariant': {
			fieldName: 'variantCode',
			label: 'Variant Code',
			queryData: availableProductVariants.data
		}
	};

	const getQueryResultByCodePart = (codePart: ModalFormCodePart) => {
		switch (codePart) {
			case 'productBase': return availableProductBases;
			case 'productSize': return availableProductSizes;
			case 'productVariant': return availableProductVariants;
			default: throw new Error('Invalid Code Name');
		}
	};

	const openModal = (codePart: ModalFormCodePart) => {
		setModalFormCodePart(codePart);
		setModalFormTitle(() => {
			switch (codePart) {
				case 'productBase': return 'Add Product Base';
				case 'productSize': return 'Add Product Size';
				case 'productVariant': return 'Add Product Variant';
				default: return '';
			}
		});
		setModalOpen(true);
	};

	const closeModal = () => {
		setModalOpen(false);
	};

	const setFieldValueByCodePart = (codePart: ModalFormCodePart, value: number) => {
		form.setValue(fieldDataByCodeName[codePart].fieldName, value);
	};

	const modalFormMutationSuccessHandler =
		(queryResult: ModalFormQueryResult) =>
			async (data: ModalFormSuccessData) => {
				console.log('in success handler');
				console.log(queryResult);
				if (queryResult) {
					await queryResult.refetch();
					if (modalFormCodePart) {
						setFieldValueByCodePart(modalFormCodePart, data.code);
					}
					closeModal();
				}
			};

	const addProduct = api.product.add.useMutation({
		onSuccess(data) {
			console.log(data);
			alert(`Successfully created new product ${buildProductCode(data.baseCode, data.sizeCode, data.variantCode)}`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Something went wrong: ${error.message}`);
		},
	});

	const submitForm: SubmitHandler<TAddProductSchema> = (data) => {
		addProduct.mutate(data);
	};

	const resetForm = () => {
		form.reset();
		setKeyForReset((n) => n + 1);
	};

	return (
		<div className={styles['add-product__form']}>
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
					modalFormCodePart &&
					<AddProductCodePartModalForm
						factoryId={factoryId}
						codePart={modalFormCodePart}
						closeModal={closeModal}
						onMutationSuccess={modalFormMutationSuccessHandler(getQueryResultByCodePart(modalFormCodePart))}
					/>
				}
			</Modal>
		</div>
	);
};

export default AddProductForm;

const FieldRow: React.FC<PropsWithChildren> = ({ children }) => (
	<div className={formStyles.fieldRow}>{children}</div>
);

const CodeFields: React.FC<{
	fieldDataByCodeName: FieldDataByCodeName;
	openModal: (codeName: ModalFormCodePart) => void;
	keyForReset: string;
}> = ({
	fieldDataByCodeName,
	openModal,
	keyForReset
}) =>
		<>
			{
				(Object.keys(fieldDataByCodeName) as ModalFormCodePart[])
					.map(
						(codeName) => {
							const { fieldName, label, queryData } = fieldDataByCodeName[codeName];

							return (
								<FieldRow key={`${codeName}-${keyForReset}`}>
									<ProductCodePartSelect
										labelText={label}
										fieldName={fieldName}
										required
										disabled={!queryData?.length}
										items={(queryData ?? []).sort((a, b) => a.code - b.code)}
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
