import styles from './add-blend.module.css';
import React, { forwardRef, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import Form from '@/components/Form';
import Modal from '@/components/Modal';
import ChooseProductModalForm from '@/components/ChooseProductModalForm';
import IcBaselineChevronLeft from '@/components/Icons/IcBaselineChevronLeft';
import IcBaselineChevronRight from '@/components/Icons/IcBaselineChevronRight';
import { authenticatedSSProps } from '@/server/auth';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import { addBlendSchema, type TAddBlendSchema } from '@/schemas/blend';
import { buildProductCode } from '@/utils/product';
import type { ComponentProps, PropsWithChildren, ChangeEvent } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import type {
	Formula as TFormula,
	FormulaComponent as TFormulaComponent,
	Product as TProduct,
	ProductCode as TProductCode,
	ProductBase as TProductBase,
	ProductSize as TProductSize,
	ProductVariant as TProductVariant,
	Tank as TTank
} from '@prisma/client';
import type { NextPageWithLayout } from '../_app';
import type { GetServerSideProps } from "next";
import type { Session } from 'next-auth';

type TDetailedProduct = TProduct & {
	Code: TDetailedProductCode;
	Formulas: TFormula[];
};

type TDetailedProductCode = TProductCode & {
	ProductBase: TProductBase;
	ProductSize: TProductSize;
	ProductVariant: TProductVariant;
};

type TDetailedFormula = TFormula & {
	Components: TDetailedFormulaComponent[];
};

type TDetailedFormulaComponent = TFormulaComponent & {
	Product: TProduct & {
		Code: TDetailedProductCode;
		SourceTanks: TTank[];
	};
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	return authenticatedSSProps(context);
};

const AddBlend: NextPageWithLayout<{ user: Session['user']; }> = ({ user }) => {
	const [matchingBlendableProduct, setMatchingBlendableProduct] = useState<TDetailedProduct>();
	const [formulaComponents, setFormulaComponents] = useState<TDetailedFormulaComponent[]>([]);
	const [selectedDestinationTank, setSelectedDestinationTank] = useState<TTank>();
	const [selectedFormula, setSelectedFormula] = useState<TDetailedFormula>();
	const [selectedComponentSourceTankIds, setSelectedComponentSourceTankIds] = useState<(string | undefined)[]>([]);
	const [modalOpen, setModalOpen] = useState<boolean>(false);

	const blendableProducts = api.product.getAllBlendableProducts.useQuery(undefined, { refetchOnWindowFocus: false });
	const selectedBlendableProduct = api.product.getBlendableProduct.useQuery(
		matchingBlendableProduct ?? { factoryId: user.factoryId ?? '', baseCode: undefined, sizeCode: undefined, variantCode: undefined },
		{
			refetchOnWindowFocus: false,
			onSuccess: (data) => {
				if (data) {
					setSelectedDestinationTankToDefault(data.SourceTanks);
					setSelectedFormulaToDefault(data.Formulas);
				}
			}
		}
	);

	const containerRef = useRef(null);

	const form = useZodForm({
		schema: addBlendSchema,
		mode: 'onBlur',
		defaultValues: {
			factoryId: user.factoryId ?? ''
		}
	});

	form.watch(['targetQuantity', 'formulaId']);

	const addBlend = api.blend.add.useMutation({
		onSuccess() {
			alert(`Successfully created new Blend.`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Error: ${error.message}`);
		}
	});

	const submitForm: SubmitHandler<TAddBlendSchema> = (data) => {
		addBlend.mutate(data);
	};

	const resetForm = () => {
		form.reset();
		setMatchingBlendableProduct(undefined);
		setFormulaComponents([]);
		setSelectedDestinationTank(undefined);
		setSelectedFormula(undefined);
		setSelectedComponentSourceTankIds([]);
	};

	const openModal = () => {
		setModalOpen(true);
	};

	const closeModal = (selectedProductCode?: TDetailedProductCode) => {
		if (selectedProductCode) {
			setMatchingBlendableProduct(findMatchingBlendableProductByProductCode(selectedProductCode));
			form.setValue('baseCode', selectedProductCode.baseCode);
			form.setValue('sizeCode', selectedProductCode.sizeCode);
			form.setValue('variantCode', selectedProductCode.variantCode);
		}
		setModalOpen(false);
	};

	const findMatchingBlendableProductByProductCode = (selectedProductCode: TDetailedProductCode) => {
		return blendableProducts.data?.find((blendableProduct) =>
			selectedProductCode.ProductBase.code === blendableProduct.Code.ProductBase.code
			&& selectedProductCode.ProductSize.code === blendableProduct.Code.ProductSize.code
			&& selectedProductCode.ProductVariant.code === blendableProduct.Code.ProductVariant.code
		);
	};

	const setSelectedDestinationTankToDefault = (destinationTanks?: TTank[]) => {
		if (destinationTanks && destinationTanks.length) {
			const defaultDestinationTank = destinationTanks.find(
				(tank) => tank.isDefaultSource
			) ?? destinationTanks[0];

			if (defaultDestinationTank) {
				setSelectedDestinationTank(defaultDestinationTank);
				form.setValue('destinationTankName', defaultDestinationTank.name);
			}
		}
	};

	const setSelectedFormulaToDefault = (formulas: TDetailedFormula[]) => {
		const defaultFormula = formulas[0];
		if (defaultFormula) {
			form.setValue('formulaId', defaultFormula.id);
			setSelectedFormula(defaultFormula);

			const formulaComponents = defaultFormula.Components;
			setFormulaComponents(formulaComponents);
			setFormulaComponentsToDefaults(formulaComponents);
		}
	};

	const setFormulaComponentsToDefaults = (formulaComponents?: TDetailedFormulaComponent[]) => {
		if (formulaComponents) {
			const defaultComponentSourceTankIds = formulaComponents.map(
				(component) => component.Product.SourceTanks.find(
					(tank) => tank.isDefaultSource
				)?.name ?? component.Product.SourceTanks[0]?.name
			);
			setSelectedComponentSourceTankIds(defaultComponentSourceTankIds);
			defaultComponentSourceTankIds.forEach((sourceTankName, componentIndex) => {
				form.setValue(`components.${componentIndex}.sourceTankName`, sourceTankName ?? '');
			});

			formulaComponents.forEach((component, componentIndex) => {
				form.setValue(`components.${componentIndex}.baseCode`, component.baseCode);
				form.setValue(`components.${componentIndex}.sizeCode`, component.sizeCode);
				form.setValue(`components.${componentIndex}.variantCode`, component.variantCode);
				form.setValue(`components.${componentIndex}.note`, component.note ?? '');
			});

			updateComponentsTargetQuantity(formulaComponents, form.getValues('targetQuantity'));
		}
	};

	const updateSelectedDestinationTank = (offset: -1 | 1) => {
		if (selectedDestinationTank) {
			const destinationTanks = selectedBlendableProduct.data?.SourceTanks;
			if (destinationTanks && destinationTanks.length) {
				const selectedTankIndex = destinationTanks.findIndex((tank) => tank.name === selectedDestinationTank.name);
				const newIndex =
					offset === -1
						? selectedTankIndex - 1 < 0
							? destinationTanks.length - 1
							: 0
						: selectedTankIndex + 1 >= destinationTanks.length
							? 0
							: selectedTankIndex + 1;
				setSelectedDestinationTank(destinationTanks[newIndex]);
				form.setValue('destinationTankName', destinationTanks[newIndex]?.name ?? '');
			}
		}
	};

	const updateSelectedFormula = (offset: -1 | 1) => {
		if (selectedFormula) {
			const formulas = selectedBlendableProduct.data?.Formulas;
			if (formulas && formulas.length) {
				const selectedFormulaIndex = formulas.findIndex((formula) => formula.id === selectedFormula.id);
				const newIndex = offset === -1
					? selectedFormulaIndex - 1 < 0
						? formulas.length - 1
						: 0
					: selectedFormulaIndex + 1 >= formulas.length
						? 0
						: selectedFormulaIndex + 1;
				setSelectedFormula(formulas[newIndex]);
				form.setValue('formulaId', formulas[newIndex]?.id ?? '');
				const formulaComponents = formulas[newIndex]?.Components;
				if (formulaComponents) {
					setFormulaComponents(formulaComponents);
					setFormulaComponentsToDefaults(formulaComponents);
				}
			}
		}
	};

	const updateSelectedComponentSourceTankId = (componentIndex: number, offset: 1 | -1) => {
		if (selectedFormula) {
			const sourceTanks = selectedFormula.Components[componentIndex]?.Product?.SourceTanks;
			if (sourceTanks && sourceTanks.length) {
				setSelectedComponentSourceTankIds((prev) => {
					if (prev && prev[componentIndex]) {
						const sourceTankIndex = sourceTanks.findIndex((sourceTank) => prev[componentIndex] === sourceTank.name);
						if (sourceTankIndex === -1) {
							return prev;
						}
						const newIndex =
							offset === 1
								? sourceTankIndex >= sourceTanks.length - 1
									? 0
									: sourceTankIndex + 1
								: sourceTankIndex === 0
									? sourceTanks.length - 1
									: sourceTankIndex - 1;
						const newTankName = sourceTanks[newIndex]?.name;
						form.setValue(`components.${componentIndex}.sourceTankName`, newTankName ?? '');
						return Array.from({ length: prev.length }, (_, k) => k === componentIndex ? newTankName : prev[k]);
					} else {
						return prev;
					}
				});
			}
		}
	};

	const updateComponentsTargetQuantity = (formulaComponents: TDetailedFormulaComponent[], blendQuantity: number) => {
		if (formulaComponents) {
			formulaComponents.forEach((component, index) => {
				form.setValue(
					`components.${index}.targetQuantity`,
					parseFloat((Number(component.proportion) * blendQuantity).toFixed(2))
				);
			});
		}
	};

	const blendQuantityChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		updateComponentsTargetQuantity(formulaComponents, parseInt(event.target.value));
	};

	return (
		<>
			<Head>
				<title>Add Blend | Production Manager</title>
				<meta name="description" content="Add a new blend." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<main ref={containerRef}>
				<article className={styles['add-blend']}>
					<h1 className={styles['add-blend__header']}>Add Blend</h1>
					<Form
						className={styles['add-blend__form']}
						form={form}
						onSubmit={submitForm}
					>
						<BlendProduct
							product={selectedBlendableProduct?.data}
							openProductSelector={() => openModal()}
						/>
						<BlendQuantity
							{...form.register('targetQuantity', { onChange: blendQuantityChangeHandler })}
						/>
						<BlendDestinationTank>
							<TankSelector
								show={Boolean(selectedDestinationTank)}
								selectedTankId={selectedDestinationTank ? selectedDestinationTank.name : undefined}
								selectPrevious={() => updateSelectedDestinationTank(-1)}
								selectNext={() => updateSelectedDestinationTank(1)}
								selectionDisabled={selectedBlendableProduct.data?.SourceTanks ? selectedBlendableProduct.data?.SourceTanks.length < 2 : true}
							/>
						</BlendDestinationTank>
						<BlendFormula show={Boolean(selectedBlendableProduct.data)}>
							<FormulaSelector
								show={Boolean(selectedBlendableProduct.data && selectedBlendableProduct.data?.Formulas && selectedFormula)}
								numberOfFormulas={selectedBlendableProduct.data?.Formulas?.length ?? 0}
								selectedFormulaIndex={selectedBlendableProduct.data?.Formulas?.findIndex((formula) => formula.id === selectedFormula?.id) ?? -1}
								selectPrevious={() => updateSelectedFormula(-1)}
								selectNext={() => updateSelectedFormula(1)}
								selectionDisabled={selectedBlendableProduct.data?.Formulas ? selectedBlendableProduct.data?.Formulas.length < 2 : true}
							/>
							<FormulaComponents
								show={Boolean(formulaComponents.length)}
								blendTargetQuantity={form.getValues('targetQuantity') ?? 0}
								formulaComponents={formulaComponents}
								selectedComponentSourceTankIds={selectedComponentSourceTankIds}
								updateSelectedComponentSourceTankId={updateSelectedComponentSourceTankId}
							/>
						</BlendFormula>
						<section className={styles['form-controls']}>
							<button className={styles['form-controls__button']} type="button" onClick={resetForm}>Reset</button>
							<button
								className={styles['form-controls__button']}
								type="submit"
								disabled={!selectedBlendableProduct.data || !form.getValues('targetQuantity')}
							>
								Submit
							</button>
						</section>
					</Form>
				</article>
				<Modal
					open={modalOpen}
					onOpenChange={setModalOpen}
					containerRef={containerRef}
					title="Choose Blendable Product"
				>
					<ChooseProductModalForm
						productCodes={blendableProducts.data?.map((blendableProduct) => blendableProduct.Code)}
						closeModal={closeModal}
					/>
				</Modal>
			</main >
		</>
	);
};

export default AddBlend;

AddBlend.getLayout = function getLayout(page) {
	return (
		<Layout>
			{page}
		</Layout>
	);
};

const BlendProduct: React.FC<
	{
		product?: TDetailedProduct | null;
		openProductSelector: () => void;
	}
> = ({ product, openProductSelector }) => {
	const productSelected = Boolean(product);
	const formattedProductCode = product?.Code
		? buildProductCode(
			product?.Code.baseCode,
			product?.Code.sizeCode,
			product?.Code.variantCode
		)
		: '';
	const productDescription = product?.description ?? '';

	return (
		<section className={styles['blend-product']}>
			<h2 className={styles['blend-product__header']}>Product</h2>
			<button className={styles['blend-product__selector']} type="button" onClick={openProductSelector}>
				{
					Boolean(product)
						? 'Change Product...'
						: 'Choose Product...'
				}
			</button>
			{
				productSelected
					? (
						<div className={styles['blend-product__value']}>
							<p>{formattedProductCode}</p>
							<p>{productDescription}</p>
						</div>
					)
					: null
			}
		</section>
	);
};

const BlendQuantity = forwardRef<HTMLInputElement, ComponentProps<'input'>>((props, ref) => (
	<section className={styles['blend-quantity']}>
		<h2 className={styles['blend-quantity__header']} id={props.name}>Quantity</h2>
		<input className={styles['blend-quantity__input']} type="text" {...props} id={props.name} ref={ref} aria-labelledby={props.name} />
	</section>
));
BlendQuantity.displayName = 'BlendQuantity';


const BlendDestinationTank: React.FC<PropsWithChildren> = ({ children }) => (
	<section className={styles['blend-destination-tank']}>
		<h2 className={styles['blend-destination-tank__header']}>Destination Tank</h2>
		{children}
	</section>
);

const BlendFormula: React.FC<{ show: boolean; } & PropsWithChildren> = ({ show, children }) =>
	show ? (
		<section className={styles['blend-formula']}>
			<h2 className={styles['blend-formula__header']}>Formula</h2>
			{children}
		</section>
	) : null;

const FormulaSelector: React.FC<{
	show: boolean;
	numberOfFormulas: number;
	selectedFormulaIndex: number;
	selectPrevious: () => void;
	selectNext: () => void;
	selectionDisabled: boolean;
}> = ({
	show,
	numberOfFormulas,
	selectedFormulaIndex,
	selectPrevious,
	selectNext,
	selectionDisabled
}) => show ? (
	<section
		className={styles['formula-selector']}
		data-selection-disabled={selectionDisabled}
	>
		<button
			className={styles['formula-selector__button']}
			type="button"
			onClick={selectPrevious}
			disabled={selectionDisabled}
		>
			<IcBaselineChevronLeft />
		</button>
		<span className={styles['formula-selector__value']}>
			{selectedFormulaIndex + 1}/{numberOfFormulas}
		</span>
		<button
			className={styles['formula-selector__button']}
			type="button"
			onClick={selectNext}
			disabled={selectionDisabled}
		>
			<IcBaselineChevronRight />
		</button>
	</section>
) : null;

const TankSelector: React.FC<{
	show: boolean;
	selectedTankId?: string;
	selectPrevious: () => void;
	selectNext: () => void;
	selectionDisabled: boolean;
}> = ({ show, selectedTankId, selectPrevious, selectNext, selectionDisabled }) =>
		show ? (
			<section
				className={styles['tank-selector']}
				data-selection-disabled={selectionDisabled}
			>
				<button
					className={styles['tank-selector__button']}
					type="button"
					onClick={selectPrevious}
				>
					<IcBaselineChevronLeft />
				</button>
				<span className={styles['tank-selector__value']}>
					{selectedTankId}
				</span>
				<button
					className={styles['tank-selector__button']}
					type="button"
					onClick={selectNext}
				>
					<IcBaselineChevronRight />
				</button>
			</section>
		) : null;

const FormulaComponents: React.FC<{
	show: boolean;
	blendTargetQuantity: number;
	formulaComponents: TDetailedFormulaComponent[];
	selectedComponentSourceTankIds: (string | undefined)[];
	updateSelectedComponentSourceTankId: (componentIndex: number, offset: -1 | 1) => void;
}> = (
	{ show,
		blendTargetQuantity,
		formulaComponents,
		selectedComponentSourceTankIds,
		updateSelectedComponentSourceTankId
	}
) => show ? (
	<section className={styles['formula-components']}>
		<h3 className={styles['formula-components__header']}>Formula Components</h3>
		<ol className={styles['formula-components__list']}>
			{
				formulaComponents.map((component, index) =>
					<li className={styles['formula-components__list-item']} key={`${component.formulaId}-${component.baseCode}`}>
						<ComponentNumber number={index + 1} />
						<ComponentProduct
							productCode={component.Product.Code}
							productDescription={component.Product.description}
						/>
						<ComponentSource>
							<TankSelector
								show={Boolean(selectedComponentSourceTankIds)}
								selectedTankId={selectedComponentSourceTankIds ? selectedComponentSourceTankIds[index] : undefined}
								selectPrevious={() => updateSelectedComponentSourceTankId(index, -1)}
								selectNext={() => updateSelectedComponentSourceTankId(index, 1)}
								selectionDisabled={component.Product?.SourceTanks.length < 2}
							/>
						</ComponentSource>
						<ComponentProportion proportion={Number(component.proportion)} />
						<ComponentQuantity
							proportion={Number(component.proportion)}
							blendTargetQuantity={blendTargetQuantity}
						/>
					</li>
				)
			}
		</ol>
	</section>
) : null;

const ComponentNumber: React.FC<
	{
		number: number;
	}
> = ({ number }) => {
	return (
		<section className={styles['component-number']}>
			<h4 className={styles['component-number__header']}>
				#
			</h4>
			<span className={styles['component-number__value']}>
				{number}
			</span>
		</section>
	);
};

const ComponentProduct: React.FC<
	{
		productCode: {
			ProductBase: TProductBase;
			ProductSize: TProductSize;
			ProductVariant: TProductVariant;
		};
		productDescription: string | null;
	}
> = ({ productCode, productDescription }) => {
	const { ProductBase, ProductSize, ProductVariant } = productCode;
	const formattedProductCode = buildProductCode(ProductBase.code, ProductSize.code, ProductVariant.code);

	return (
		<section className={styles['component-product']}>
			<h4 className={styles['component-product__header']}>
				Product
			</h4>
			<div className={styles['component-product__value']}>
				<p>{formattedProductCode}</p>
				{
					productDescription
						? <p>{productDescription}</p>
						: null
				}
			</div>
		</section>
	);
};

const ComponentProportion: React.FC<
	{
		proportion: number;
	}
> = ({ proportion }) => {
	const formattedProportion = Number(proportion).toFixed(3);

	return (
		<section className={styles['component-proportion']}>
			<h4 className={styles['component-proportion__header']}>Proportion</h4>
			<span className={styles['component-proportion__value']}>{formattedProportion}</span>
		</section>
	);
};

const ComponentSource: React.FC<PropsWithChildren> = ({ children }) => (
	<section className={styles['component-source']}>
		<h4 className={styles['component-source__header']}>Source</h4>
		{children}
	</section>
);

const ComponentQuantity: React.FC<{
	proportion: number;
	blendTargetQuantity: number;
}> = ({ proportion, blendTargetQuantity }) => {
	const quantity = (blendTargetQuantity ? (Number(proportion) * blendTargetQuantity) : 0).toFixed(2);

	return (
		<section className={styles['component-quantity']}>
			<h4 className={styles['component-quantity__header']}>Quantity</h4>
			<span className={styles['component-quantity__value']}>{quantity}</span>
		</section>
	);
};