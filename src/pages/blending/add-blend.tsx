import styles from './add-blend.module.css';
import React, { forwardRef, useRef, useState } from 'react';
import Head from 'next/head';
import Form from '@/components/Form';
import Modal from '@/components/Modal';
import ChooseProductModalForm from '@/components/ChooseProductModalForm';
import IcBaselineChevronLeft from '@/components/Icons/IcBaselineChevronLeft';
import IcBaselineChevronRight from '@/components/Icons/IcBaselineChevronRight';
import { api } from '@/utils/api';
import { useZodForm } from '@/hooks/useZodForm';
import { addBlendSchema } from '@/schemas/blending';
import { buildProductCode } from '@/utils/product';
import type { ComponentProps, PropsWithChildren, ChangeEvent } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import type {
	BlendFormula as TBlendFormula,
	BlendFormulaComponent as TBlendFormulaComponent,
	Product as TProduct,
	ProductBaseCode as TProductBaseCode,
	ProductCode as TProductCode,
	ProductSizeCode as TProductSizeCode,
	ProductVariantCode as TProductVariantCode,
	Tank as TTank
} from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime';
import type { z } from 'zod';
import { NextPageWithLayout } from '../_app';
import Layout from '@/components/Layout';

type TDetailedProductCode = TProductCode & {
	BaseCode: TProductBaseCode;
	SizeCode: TProductSizeCode;
	VariantCode: TProductVariantCode;
};

type TDetailedProduct = TProduct & {
	Code: TProductCode & {
		BaseCode: TProductBaseCode;
		SizeCode: TProductSizeCode;
		VariantCode: TProductVariantCode;
	};
	BlendFormulas: TBlendFormula[];
};

type TDetailedFormula = TBlendFormula & {
	Components: (TBlendFormulaComponent & {
		Product: TProduct & {
			Code: TDetailedProductCode;
			SourceTanks: TTank[];
		};
	})[];
};

type TDetailedFormulaComponent = TBlendFormulaComponent & {
	Product: TProduct & {
		Code: TDetailedProductCode;
		SourceTanks: TTank[];
	};
};

const AddBlend: NextPageWithLayout = () => {
	const [matchingBlendableProduct, setMatchingBlendableProduct] = useState<TDetailedProduct>();
	const [formulaComponents, setFormulaComponents] = useState<TDetailedFormulaComponent[]>([]);
	const [selectedDestinationTank, setSelectedDestinationTank] = useState<TTank>();
	const [selectedFormula, setSelectedFormula] = useState<TDetailedFormula>();
	const [selectedComponentSourceTankIds, setSelectedComponentSourceTankIds] = useState<(string | undefined)[]>([]);
	const [modalOpen, setModalOpen] = useState<boolean>(false);

	const blendableProducts = api.blending.getAllBlendableProducts.useQuery(undefined, { refetchOnWindowFocus: false });
	const selectedBlendableProduct = api.blending.getBlendableProduct.useQuery(
		matchingBlendableProduct ?? { baseCodeId: undefined, sizeCodeId: undefined, variantCodeId: undefined },
		{
			refetchOnWindowFocus: false,
			onSuccess: (data) => {
				if (data) {
					setSelectedDestinationTankToDefault(data.SourceTanks);
					setSelectedFormulaToDefault(data.BlendFormulas);
				}
			}
		}
	);

	const containerRef = useRef(null);

	const form = useZodForm({
		schema: addBlendSchema,
		mode: 'onBlur'
	});

	form.watch(['targetQuantity', 'formulaId']);

	const addBlend = api.blending.addBlend.useMutation({
		onSuccess(data) {
			alert(`Successfully created new Blend.`);
			resetForm();
		},
		onError(error) {
			console.error(error);
			alert(`Error: ${error.message}`);
		}
	});

	const submitForm: SubmitHandler<z.infer<typeof addBlendSchema>> = (data) => {
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
		}
		setModalOpen(false);
	};

	const findMatchingBlendableProductByProductCode = (selectedProductCode: TDetailedProductCode) => {
		return blendableProducts.data?.find((blendableProduct) =>
			selectedProductCode.BaseCode.id === blendableProduct.Code.BaseCode.id
			&& selectedProductCode.SizeCode.id === blendableProduct.Code.SizeCode.id
			&& selectedProductCode.VariantCode.id === blendableProduct.Code.VariantCode.id
		);
	};

	const setSelectedDestinationTankToDefault = (destinationTanks?: TTank[]) => {
		if (destinationTanks && destinationTanks.length) {
			const defaultDestinationTank = destinationTanks.find(
				(tank) => tank.isDefaultSource
			) ?? destinationTanks[0];

			if (defaultDestinationTank) {
				setSelectedDestinationTank(defaultDestinationTank);
				form.setValue('destinationTankId', defaultDestinationTank.id);
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
				)?.id ?? component.Product.SourceTanks[0]?.id
			);
			setSelectedComponentSourceTankIds(defaultComponentSourceTankIds);
			defaultComponentSourceTankIds.forEach((sourceTankId, componentIndex) => {
				form.setValue(`components.${componentIndex}.sourceTankId`, sourceTankId ?? '');
			});

			formulaComponents.forEach((component, componentIndex) => {
				form.setValue(`components.${componentIndex}.formulaComponentId`, component.id);
				form.setValue(`components.${componentIndex}.note`, component.note ?? '');
			});

			updateComponentsTargetQuantity(formulaComponents, form.getValues('targetQuantity'));
		}
	};

	const updateSelectedDestinationTank = (offset: -1 | 1) => {
		if (selectedDestinationTank) {
			const destinationTanks = selectedBlendableProduct.data?.SourceTanks;
			if (destinationTanks && destinationTanks.length) {
				const selectedTankIndex = destinationTanks.findIndex((tank) => tank.id === selectedDestinationTank.id);
				const newIndex =
					offset === -1
						? selectedTankIndex - 1 < 0
							? destinationTanks.length - 1
							: 0
						: selectedTankIndex + 1 >= destinationTanks.length
							? 0
							: selectedTankIndex + 1;
				setSelectedDestinationTank(destinationTanks[newIndex]);
				form.setValue('destinationTankId', destinationTanks[newIndex]?.id ?? '');
			}
		}
	};

	const updateSelectedFormula = (offset: -1 | 1) => {
		if (selectedFormula) {
			const formulas = selectedBlendableProduct.data?.BlendFormulas;
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
						const sourceTankIndex = sourceTanks.findIndex((sourceTank) => prev[componentIndex] === sourceTank.id);
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
						const newId = sourceTanks[newIndex]?.id;
						form.setValue(`components.${componentIndex}.sourceTankId`, newId ?? '');
						return Array.from({ length: prev.length }, (_, k) => k === componentIndex ? newId : prev[k]);
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
								selectedTankId={selectedDestinationTank ? selectedDestinationTank.id : undefined}
								selectPrevious={() => updateSelectedDestinationTank(-1)}
								selectNext={() => updateSelectedDestinationTank(1)}
								selectionDisabled={selectedBlendableProduct.data?.SourceTanks ? selectedBlendableProduct.data?.SourceTanks.length < 2 : true}
							/>
						</BlendDestinationTank>
						<BlendFormula show={Boolean(selectedBlendableProduct.data)}>
							<FormulaSelector
								show={Boolean(selectedBlendableProduct.data && selectedBlendableProduct.data?.BlendFormulas && selectedFormula)}
								numberOfFormulas={selectedBlendableProduct.data?.BlendFormulas?.length ?? 0}
								selectedFormulaIndex={selectedBlendableProduct.data?.BlendFormulas?.findIndex((formula) => formula.id === selectedFormula?.id) ?? -1}
								selectPrevious={() => updateSelectedFormula(-1)}
								selectNext={() => updateSelectedFormula(1)}
								selectionDisabled={selectedBlendableProduct.data?.BlendFormulas ? selectedBlendableProduct.data?.BlendFormulas.length < 2 : true}
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
							<button className={styles['form-controls__button']} type="submit">Submit</button>
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
			product?.Code.baseCodeId,
			product?.Code.sizeCodeId,
			product?.Code.variantCodeId
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
					<li className={styles['formula-components__list-item']} key={`${component.formulaId}-${component.baseCodeId}`}>
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
						<ComponentProportion proportion={component.proportion} />
						<ComponentQuantity
							proportion={component.proportion}
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
			BaseCode: TProductBaseCode;
			SizeCode: TProductSizeCode;
			VariantCode: TProductVariantCode;
		};
		productDescription: string | null;
	}
> = ({ productCode, productDescription }) => {
	const { BaseCode, SizeCode, VariantCode } = productCode;
	const formattedProductCode = buildProductCode(BaseCode.id, SizeCode.id, VariantCode.id);

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
		proportion: Decimal;
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
	proportion: Decimal;
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