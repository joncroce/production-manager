import styles from './add-formula.module.css';
import Form from '@/components/Form';
import { useZodForm } from '@/hooks/useZodForm';
import { addFormulaSchema } from '@/schemas/blending';
import { api } from '@/utils/api';
import { type ProductBaseCode } from '@prisma/client';
import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { SubmitHandler, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import Modal from '@/components/Modal';
import ChooseBaseCodeModalForm from './components/ChooseBaseCodeModalForm';

const AddFormula: NextPage = () => {
	const [matchingBaseCode, setMatchingBaseCode] = useState<ProductBaseCode>();
	const [matchingComponentBaseCodes, setMatchingComponentBaseCodes] = useState<(ProductBaseCode | undefined)[]>([]);
	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const [modalFormFieldId, setModalFormFieldId] = useState<'baseCodeId' | `formulaComponents.${number}.baseCodeId`>('baseCodeId');
	const availableBaseCodes = api.baseCode.getAll.useQuery(undefined, { refetchOnWindowFocus: false });
	const containerRef = useRef(null);

	const defaultFormulaComponentFormValue = {
		baseCodeId: '',
		proportion: '',
		note: ''
	};

	const defaultFormValues = {
		baseCodeId: '',
		formulaComponents: Array.from({ length: 2 }, () => defaultFormulaComponentFormValue)
	};

	const form = useZodForm({
		schema: addFormulaSchema,
		mode: 'onBlur',
		// @ts-expect-error string inputs coerced to number
		defaultValues: defaultFormValues
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'formulaComponents'
	});

	const openModal = (fieldId: 'baseCodeId' | `formulaComponents.${number}.baseCodeId`) => {
		setModalFormFieldId(fieldId);
		setModalOpen(true);
	};

	const closeModal = (selectedBaseCodeId?: number) => {
		if (selectedBaseCodeId && modalFormFieldId) {
			form.setValue(modalFormFieldId, selectedBaseCodeId);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const match = matchBaseCode(selectedBaseCodeId)!;
			if (modalFormFieldId === 'baseCodeId') {
				setMatchingBaseCode(match);
			} else {
				const start = modalFormFieldId.indexOf('.') + 1;
				const end = modalFormFieldId.lastIndexOf('.');
				const componentNumber = parseInt(modalFormFieldId.slice(start, end));
				updateMatchedComponentBaseCode(match, componentNumber);
			}
		}
		setModalOpen(false);
	};

	const appendFormulaComponent = () => {
		// @ts-expect-error string inputs coerced to number
		append(defaultFormulaComponentFormValue);
	};

	const addFormula = api.blending.addFormula.useMutation({
		onSuccess(data) {
			alert(`Successfully created new BlendFormula for Product ID ${data.productId}`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Error: ${error.message}`);
		}
	});

	const submitForm: SubmitHandler<z.infer<typeof addFormulaSchema>> = (data) => {
		addFormula.mutate(data);
	};

	const resetForm = () => {
		form.reset();
		fields.forEach((_, i) => {
			remove(i);
		});
		setMatchingBaseCode(undefined);
		setMatchingComponentBaseCodes([]);
	};

	const updateMatchedComponentBaseCode = (match: ProductBaseCode, index: number) => {
		setMatchingComponentBaseCodes(prevState => prevState.slice(0, index).concat([match]).concat(prevState.slice(index + 1)));
	};

	const matchBaseCode = (value: string | number) => {
		console.log(`matching ${value}`);
		const baseCodeInput = typeof value === 'number' ? value : parseInt(value);
		const match = availableBaseCodes.data?.find((val) => val.id === baseCodeInput);

		return match ?? null;
	};

	const removeComponent = (index: number) => {
		remove(index);
		setMatchingComponentBaseCodes(prevState => prevState.slice(0, index).concat(prevState.slice(index + 1)));
	};

	return (
		<>
			<Head>
				<title>Add Blend Formula | Production Manager</title>
				<meta name="description" content="Add a new formula for blending." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main ref={containerRef}>
				<article className={styles['page']}>
					<h1 className={styles['page__heading']}>Add Blend Formula</h1>
					<Form
						className={styles['add-formula-form']}
						form={form}
						onSubmit={submitForm}
					>
						<section className={styles['add-formula-form__section']}>
							<h2 className={styles['add-formula-form__heading']}>Finished Product</h2>
							<BaseCode
								form={form}
								fieldId='baseCodeId'
								baseCode={matchingBaseCode}
								openModal={openModal}
							/>
						</section>
						<section className={styles['add-formula-form__section']}>
							<h2 className={styles['add-formula-form__heading']}>Blend Formula Components</h2>
							<button className={styles['add-formula-form__button']} type="button" onClick={appendFormulaComponent}>+ Add Component</button>
							<ol className={styles['add-formula-form__component-list']}>
								{fields.map((field, index) => (
									<li
										className={styles['add-formula-form__component-list-item']}
										key={field.id}
									>
										<FormulaComponent
											form={form}
											index={index}
											baseCode={matchingComponentBaseCodes[index]}
											openModal={openModal}
											remove={removeComponent}
										/>
									</li>
								))}
							</ol>
						</section>
						<section className={styles['add-formula-form__controls']}>
							<button className={styles['add-formula-form__button']} type="button" onClick={resetForm}>Reset</button>
							<button className={styles['add-formula-form__button']} type="submit">Submit</button>
						</section>
					</Form>
				</article>
				<Modal
					open={modalOpen}
					onOpenChange={setModalOpen}
					containerRef={containerRef}
					title="Choose Base Code"
				>
					<ChooseBaseCodeModalForm
						fieldId={modalFormFieldId}
						availableBaseCodes={availableBaseCodes.data}
						closeModal={closeModal}
					/>
				</Modal>
			</main>
		</>
	);
};

export default AddFormula;

const BaseCode: React.FC<
	{
		form: UseFormReturn<{
			baseCodeId: number;
			formulaComponents: {
				note?: string | undefined;
				baseCodeId: number;
				proportion: number;
			}[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}, any>;
		fieldId: 'baseCodeId' | `formulaComponents.${number}.baseCodeId`;
		baseCode?: ProductBaseCode;
		openModal: (fieldId: 'baseCodeId' | `formulaComponents.${number}.baseCodeId`) => void;
	}
> = ({ form, fieldId, baseCode, openModal }) => (
	<div className={styles['base-code']}>
		<h3 className={styles['base-code__label']}>Base Code</h3>
		<input hidden type="string" {...form.register(fieldId)} />
		{
			baseCode
				? <div className={styles['base-code__value']}><strong>{baseCode.id}</strong>: {baseCode.name}</div>
				: null
		}
		<button className={styles['base-code__button']} type="button" onClick={() => openModal(fieldId)}>{baseCode ? 'Replace' : 'Choose...'}</button>
	</div>
);

const FormulaComponent: React.FC<
	{
		form: UseFormReturn<{
			baseCodeId: number;
			formulaComponents: {
				note?: string | undefined;
				baseCodeId: number;
				proportion: number;
			}[];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}, any>;
		index: number;
		baseCode?: ProductBaseCode;
		openModal: (fieldId: 'baseCodeId' | `formulaComponents.${number}.baseCodeId`) => void;
		remove: (index: number) => void;

	}
> = ({ form, index, baseCode, openModal, remove }) => (
	<div className={styles['formula-component']}>
		<div className={styles['formula-component__remove']}>
			<button
				className={
					[
						styles['formula-component__button'],
						styles['formula-component__button--remove']
					].join(' ')
				}
				type="button"
				onClick={() => remove(index)}
			>
				Remove
			</button>
		</div>
		<div className={styles['formula-component__number']}>
			{index + 1}.
		</div>
		<div className={styles['formula-component__base-code']}>
			<BaseCode
				form={form}
				fieldId={`formulaComponents.${index}.baseCodeId`}
				baseCode={baseCode}
				openModal={openModal}
			/>
		</div>
		<div className={styles['formula-component__proportion']}>
			<label className={styles['formula-component__label']} htmlFor={`formulaComponents.${index}.proportion`}>
				Proportion
			</label>
			<input className={styles['formula-component__input']} id={`formulaComponents.${index}.proportion`} type="text" {...form.register(`formulaComponents.${index}.proportion`)} />
		</div>
		<div className={styles['formula-component__note']}>
			<label className={styles['formula-component__label']} htmlFor={`formulaComponents.${index}.note`}>
				Note (optional)
			</label>
			<input className={styles['formula-component__input']} id={`formulaComponents.${index}.note`} type="text" {...form.register(`formulaComponents.${index}.note`)} />
		</div>
	</div>
);