import styles from './add-formula.module.css';
import React, { useState, useRef, forwardRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useZodForm } from '@/hooks/useZodForm';
import { api } from '@/utils/api';
import { buildProductCode } from '@/utils/product';
import { addFormulaSchema } from '@/schemas/blending';
import Head from 'next/head';
import Form from '@/components/Form';
import Modal from '@/components/Modal';
import ChooseProductModalForm from '@/components/ChooseProductModalForm';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '../_app';
import type { MouseEventHandler, ComponentProps, PropsWithChildren } from 'react';
import type { SubmitHandler, UseFormRegister } from 'react-hook-form';
import type { z } from 'zod';
import type {
	Product as TProduct,
	ProductCode as TProductCode,
	ProductBaseCode as TProductBaseCode,
	ProductSizeCode as TProductSizeCode,
	ProductVariantCode as TProductVariantCode
} from '@prisma/client';

type TDetailedProductCode = TProductCode & {
	BaseCode: TProductBaseCode;
	SizeCode: TProductSizeCode;
	VariantCode: TProductVariantCode;
};

type TDetailedProduct = TProduct & {
	Code: TDetailedProductCode;
};

type TAddFormulaSchema = z.infer<typeof addFormulaSchema>;

const AddFormula: NextPageWithLayout = () => {
	const [matchingProduct, setMatchingProduct] = useState<TDetailedProduct>();
	const [matchingComponentProducts, setMatchingComponentProducts] = useState<(TDetailedProduct | undefined)[]>([]);
	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const [modalOpenForComponentNumber, setModalOpenForComponentNumber] = useState<number | undefined>();
	const products = api.products.getAll.useQuery(undefined, { refetchOnWindowFocus: false });
	const containerRef = useRef(null);

	const defaultNumberOfFormulaComponents = 2;

	const defaultFormulaComponentFormValue = {
		baseCodeId: '',
		sizeCodeId: '',
		variantCodeId: '',
		proportion: '',
		note: ''
	};

	const defaultFormValues = {
		baseCodeId: '',
		sizeCodeId: '',
		variantCodeId: '',
		formulaComponents: Array.from(
			{ length: defaultNumberOfFormulaComponents },
			() => defaultFormulaComponentFormValue
		)
	};

	const form = useZodForm({
		schema: addFormulaSchema,
		mode: 'onBlur',
		// @ts-expect-error string inputs coerced to number
		defaultValues: defaultFormValues,
		resetOptions: {
			keepDefaultValues: true
		}
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'formulaComponents'
	});

	const openModal = (forComponentNumber?: number) => {
		setModalOpenForComponentNumber(forComponentNumber);
		setModalOpen(true);
	};

	const closeModal = (selectedProductCode?: TDetailedProductCode) => {
		if (selectedProductCode) {
			const matchingProduct = findMatchingProductByProductCode(selectedProductCode);
			if (matchingProduct) {
				if (modalOpenForComponentNumber === undefined) {
					updateMatchingProduct(matchingProduct);
				} else {
					updateMatchingComponentProduct(matchingProduct, modalOpenForComponentNumber);
				}
			}
		}
		setModalOpen(false);
	};

	const findMatchingProductByProductCode = (selectedProductCode: TDetailedProductCode) => {
		return products.data?.find((product) =>
			selectedProductCode.BaseCode.id === product.Code.BaseCode.id
			&& selectedProductCode.SizeCode.id === product.Code.SizeCode.id
			&& selectedProductCode.VariantCode.id === product.Code.VariantCode.id
		);
	};

	const updateMatchingProduct = (matchingProduct: TDetailedProduct) => {
		form.setValue('baseCodeId', matchingProduct.Code.BaseCode.id);
		form.setValue('sizeCodeId', matchingProduct.Code.SizeCode.id);
		form.setValue('variantCodeId', matchingProduct.Code.VariantCode.id);
		setMatchingProduct(matchingProduct);
	};

	const updateMatchingComponentProduct = (matchingProduct: TDetailedProduct, index: number) => {
		form.setValue(`formulaComponents.${index}.baseCodeId`, matchingProduct.Code.BaseCode.id);
		form.setValue(`formulaComponents.${index}.sizeCodeId`, matchingProduct.Code.SizeCode.id);
		form.setValue(`formulaComponents.${index}.variantCodeId`, matchingProduct.Code.VariantCode.id);
		setMatchingComponentProducts(prevState =>
			prevState
				.slice(0, index)
				.concat([matchingProduct])
				.concat(prevState.slice(index + 1))
		);
	};

	const addFormulaComponent = () => {
		// @ts-expect-error string inputs coerced to number
		append(defaultFormulaComponentFormValue);
	};

	const removeFormulaComponent = (index: number) => {
		remove(index);
		setMatchingComponentProducts(prevState => {
			const nextState = prevState.slice(0, index).concat(prevState.slice(index + 1));
			nextState.forEach((componentProduct, i) => {
				if (componentProduct) {
					form.setValue(`formulaComponents.${i}.baseCodeId`, componentProduct.Code.BaseCode.id);
					form.setValue(`formulaComponents.${i}.sizeCodeId`, componentProduct.Code.SizeCode.id);
					form.setValue(`formulaComponents.${i}.variantCodeId`, componentProduct.Code.VariantCode.id);
				}
			});
			return nextState;
		});
	};

	const addFormula = api.blending.addFormula.useMutation({
		onSuccess(data) {
			alert(`Successfully created new BlendFormula for ${buildProductCode(data.baseCodeId, data.sizeCodeId, data.variantCodeId)}`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Error: ${error.message}`);
		}
	});

	const submitForm: SubmitHandler<TAddFormulaSchema> = (data) => {
		addFormula.mutate(data);
	};

	const resetForm = () => {
		form.reset();
		setMatchingProduct(undefined);
		setMatchingComponentProducts([]);
	};

	return (
		<>
			<Head>
				<title>Add Blend Formula | Production Manager</title>
				<meta name="description" content="Add a new formula for blending." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main ref={containerRef}>
				<article className={styles['add-formula']}>
					<h1 className={styles['add-formula__header']}>Add Formula</h1>
					<Form
						className={styles['add-formula__form']}
						form={form}
						onSubmit={submitForm}
					>
						<FormulaProduct
							product={matchingProduct}
							openProductSelector={() => openModal()}
						/>
						<FormulaComponents
							show={Boolean(matchingProduct)}
							register={form.register}
							matchingComponentProducts={fields.map((_, i) => matchingComponentProducts[i])}
							openModal={openModal}
							addFormulaComponent={addFormulaComponent}
							removeFormulaComponent={removeFormulaComponent}
						/>
						<FormControls show={Boolean(matchingProduct)}>
							<button className={styles['form-controls__button']} type="button" onClick={resetForm}>Reset</button>
							<button className={styles['form-controls__button']} type="submit">Submit</button>
						</FormControls>
					</Form>
				</article>
				<Modal
					open={modalOpen}
					onOpenChange={setModalOpen}
					containerRef={containerRef}
					title="Choose Product Code"
				>
					<ChooseProductModalForm
						productCodes={products?.data?.map((product) => product.Code)}
						closeModal={closeModal}
					/>
				</Modal>
			</main>
		</>
	);
};

export default AddFormula;

AddFormula.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

const FormulaProduct: React.FC<
	{
		product?: TDetailedProduct;
		openProductSelector: MouseEventHandler;
	}
> = ({ product, openProductSelector }) => {
	const productSelected = Boolean(product);
	const formattedProductCode = product?.Code
		? buildProductCode(
			product?.Code.baseCodeId,
			product?.Code.sizeCodeId,
			product?.Code.variantCodeId
		)
		: '';
	const productDescription = product?.description ?? '';

	return (
		<section className={styles['formula-product']}>
			<h2 className={styles['formula-product__header']}>Product</h2>
			<button className={styles['formula-product__selector']} type="button" onClick={openProductSelector}>
				{
					Boolean(product)
						? 'Change Product...'
						: 'Choose Product...'
				}
			</button>
			{
				productSelected
					? (
						<div className={styles['formula-product__value']}>
							<p>{formattedProductCode}</p>
							<p>{productDescription}</p>
						</div>
					)
					: null
			}
		</section>
	);
};

const FormulaComponents: React.FC<
	{
		show: boolean;
		register: UseFormRegister<TAddFormulaSchema>;
		matchingComponentProducts: (TDetailedProduct | undefined)[];
		openModal: (forComponentNumber?: number) => void;
		addFormulaComponent: () => void;
		removeFormulaComponent: (componentNumber: number) => void;
	}
> = ({ show, register, matchingComponentProducts, openModal, addFormulaComponent, removeFormulaComponent }) =>
		show ? (
			<section className={styles['formula-components']}>
				<h2 className={styles['formula-components__header']}>Components</h2>
				<button className={styles['formula-components__button']} type="button" onClick={addFormulaComponent}>Add</button>
				<ol className={styles['formula-components__list']}>
					{
						matchingComponentProducts.map((product, index) =>
							<li
								className={styles['formula-components__list-item']}
								key={`${product ? buildProductCode(product.baseCodeId, product.sizeCodeId, product.variantCodeId) : 'undefined'}-${index}`}
							>
								<RemoveComponent clickHandler={() => removeFormulaComponent(index)} />
								<ComponentNumber number={index + 1} />
								<ComponentProduct
									product={product}
									openProductSelector={() => openModal(index)}
								/>
								<ComponentProportion
									{...register(`formulaComponents.${index}.proportion`)}
								/>
								<ComponentNote
									{...register(`formulaComponents.${index}.note`)}
								/>
							</li>
						)
					}
				</ol>
			</section>
		) : null;

const RemoveComponent: React.FC<
	{
		clickHandler: MouseEventHandler;
	}
> = ({ clickHandler }) => (
	<section className={styles['component-remove']}>
		<button className={styles['component-remove__button']} type="button" onClick={clickHandler}>Remove</button>
	</section>
);

const ComponentNumber: React.FC<
	{
		number: number;
	}
> = ({ number }) => (
	<section className={styles['component-number']}>
		<h3 className={styles['component-number__header']}>
			#
		</h3>
		<span className={styles['component-number__value']}>
			{number}
		</span>
	</section>
);

const ComponentProduct: React.FC<
	{
		product?: TDetailedProduct;
		openProductSelector: MouseEventHandler;
	}
> = ({ product, openProductSelector }) => {
	const productSelected = Boolean(product);
	const formattedProductCode = product?.Code
		? buildProductCode(
			product?.Code.baseCodeId,
			product?.Code.sizeCodeId,
			product?.Code.variantCodeId
		)
		: '';
	const productDescription = product?.description ?? '';

	return (
		<section className={styles['component-product']}>
			<h2 className={styles['component-product__header']}>Product</h2>
			<button className={styles['component-product__selector']} type="button" onClick={openProductSelector}>
				{
					Boolean(product)
						? 'Change Product...'
						: 'Choose Product...'
				}
			</button>
			{
				productSelected
					? (
						<div className={styles['component-product__value']}>
							<p>{formattedProductCode}</p>
							<p>{productDescription}</p>
						</div>
					)
					: null
			}
		</section>
	);
};

const ComponentProportion = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
	<section className={styles['component-proportion']}>
		<h3 className={styles['component-proportion__header']}>Proportion</h3>
		<input className={styles['component-proportion__input']} {...props} id={props.name} ref={ref} />
	</section>
));
ComponentProportion.displayName = 'ComponentProportion';

const ComponentNote = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
	<section className={styles['component-note']}>
		<h3 className={styles['component-note__header']}>Note</h3>
		<input className={styles['component-note__input']} {...props} id={props.name} ref={ref} />
	</section>
));
ComponentNote.displayName = 'ComponentNote';

const FormControls: React.FC<{ show: boolean; } & PropsWithChildren> = ({ show, children }) =>
	show ? (
		<section className={styles['form-controls']}>
			{children}
		</section>
	) : null;