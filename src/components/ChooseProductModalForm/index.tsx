import styles from './index.module.css';
import React from 'react';
import Form from '@/components/Form';
import { z } from 'zod';
import { useState } from 'react';
import { useZodForm } from '@/hooks/useZodForm';
import type { SubmitHandler } from 'react-hook-form';
import type {
	ProductCode as TProductCode,
	ProductBase as TProductBase,
	ProductSize as TProductSize,
	ProductVariant as TProductVariant
} from '@prisma/client';

type TDetailedProductCode = TProductCode & {
	ProductBase: TProductBase;
	ProductSize: TProductSize;
	ProductVariant: TProductVariant;
};

type TSearchFormInput = z.infer<typeof searchFormSchema>;

const searchFormSchema = z.object({
	baseSearchTerm: z.string(),
	baseSearchField: z.enum(['code', 'name']),
	sizeSearchTerm: z.string(),
	sizeSearchField: z.enum(['code', 'name']),
	variantSearchTerm: z.string(),
	variantSearchField: z.enum(['code', 'name']),
});

const ChooseProductModalForm: React.FC<
	{
		productCodes?: TDetailedProductCode[];
		closeModal: (selectedProductCode?: TDetailedProductCode) => void;
	}
> = ({ productCodes, closeModal }) => {
	const [searchResults, setSearchResults] = useState<TDetailedProductCode[]>();
	const [selectedProductCode, setSelectedProductCode] = useState<TDetailedProductCode>();

	const form = useZodForm({
		schema: searchFormSchema,
		defaultValues: {
			baseSearchTerm: '',
			baseSearchField: 'code',
			sizeSearchTerm: '1',
			sizeSearchField: 'code',
			variantSearchTerm: '0',
			variantSearchField: 'code',
		}
	});

	const submitSearchForm: SubmitHandler<TSearchFormInput> = (input: TSearchFormInput) => {
		const matches = searchProducts(input);
		if (matches) {
			setSearchResults(matches);
		}
	};

	const resetSearchForm = () => {
		form.reset();
	};

	const searchProducts = (input: TSearchFormInput) => {
		if (productCodes && productCodes.length) {
			const baseSearchTerm = input.baseSearchTerm.trim().toLowerCase();
			const sizeSearchTerm = input.sizeSearchTerm.trim().toLowerCase();
			const variantSearchTerm = input.variantSearchTerm.trim().toLowerCase();

			return productCodes.filter((productCode) => (
				(
					!baseSearchTerm.length
					|| (input.baseSearchField === 'code' && String(productCode.ProductBase.code).includes(baseSearchTerm))
					|| (input.baseSearchField === 'name' && productCode.ProductBase.name.toLowerCase().includes(baseSearchTerm))
				)
				&& (
					!sizeSearchTerm.length
					|| (input.sizeSearchField === 'code' && String(productCode.ProductSize.code).includes(sizeSearchTerm))
					|| (input.sizeSearchField === 'name' && productCode.ProductSize.name.toLowerCase().includes(sizeSearchTerm))
				)
				&& (
					!variantSearchTerm.length
					|| (input.variantSearchField === 'code' && String(productCode.ProductVariant.code).includes(variantSearchTerm))
					|| (input.variantSearchField === 'name' && productCode.ProductVariant.name.toLowerCase().includes(variantSearchTerm))
				)
			));
		}
	};

	return (
		<>
			<Form className={styles['search-form']} form={form} onSubmit={submitSearchForm}>
				<fieldset className={styles['search-form__fieldset']}>
					<label className={styles['search-form__label']} htmlFor="baseSearchTerm">
						Product Base
					</label>
					<label className={styles['search-form__label']} htmlFor="baseSearchField-code">
						<input
							className={styles['search-form__input']}
							type="radio" value="code" id="baseSearchField-code" {...form.register('baseSearchField')}
						/>
						Code
					</label>
					<label className={styles['search-form__label']} htmlFor="baseSearchField-name">
						<input className={styles['search-form__input']} type="radio" value="name" id="baseSearchField-name" {...form.register('baseSearchField')} />
						Name
					</label>
					<input className={styles['search-form__input']} type="text" id="baseSearchTerm" {...form.register('baseSearchTerm')} />
				</fieldset>
				<details>
					<summary>Advanced Search</summary>
					<fieldset className={styles['search-form__fieldset']}>
						<label className={styles['search-form__label']} htmlFor="sizeSearchTerm">
							Product Size
						</label>
						<label className={styles['search-form__label']} htmlFor="sizeSearchField-code">
							<input
								className={styles['search-form__input']}
								type="radio" value="code" id="sizeSearchField-code" {...form.register('sizeSearchField')}
							/>
							Code
						</label>
						<label className={styles['search-form__label']} htmlFor="sizeSearchField-name">
							<input className={styles['search-form__input']} type="radio" value="name" id="sizeSearchField-name" {...form.register('sizeSearchField')} />
							Name
						</label>
						<input className={styles['search-form__input']} type="text" id="sizeSearchTerm" {...form.register('sizeSearchTerm')} />
					</fieldset>
					<fieldset className={styles['search-form__fieldset']}>
						<label className={styles['search-form__label']} htmlFor="variantSearchTerm">
							Product Variant
						</label>
						<label className={styles['search-form__label']} htmlFor="variantSearchField-code">
							<input
								className={styles['search-form__input']}
								type="radio" value="code" id="variantSearchField-code" {...form.register('variantSearchField')}
							/>
							Code
						</label>
						<label className={styles['search-form__label']} htmlFor="variantSearchField-name">
							<input className={styles['search-form__input']} type="radio" value="name" id="variantSearchField-name" {...form.register('variantSearchField')} />
							Name
						</label>
						<input className={styles['search-form__input']} type="text" id="variantSearchTerm" {...form.register('variantSearchTerm')} />
					</fieldset>
				</details>
				<div className={styles['search-form__controls']}>
					<button className={styles['search-form__button']} type="button" onClick={() => resetSearchForm()} data-for="reset">Reset</button>
					<button className={styles['search-form__button']} type="submit" data-for="submit">Search 🔎</button>
				</div>
			</Form>
			<div className={styles['search-results']}>
				{searchResults
					? searchResults.length
						? <>
							<div className={styles['search-results__header']}>
								<span>Base</span>
								<span>Size</span>
								<span>Variant</span>
							</div>
							<ul className={styles['search-results__list']}>
								{
									searchResults.map((productCode) =>
										<li
											className={
												[
													styles['search-results__list-item'],
													styles['search-result'],
													selectedProductCode
														&& selectedProductCode.ProductBase.code === productCode.ProductBase.code
														&& selectedProductCode.ProductSize.code === productCode.ProductSize.code
														&& selectedProductCode.ProductVariant.code === productCode.ProductVariant.code
														? styles['search-results__list-item--selected']
														: '',
												].join(' ')
											}
											key={`${productCode.ProductBase.code}-${productCode.ProductSize.code}-${productCode.ProductVariant.code}`}
											onClick={() => setSelectedProductCode(productCode)}
										>
											<section className={styles['search-result__field']}>
												<div className={styles['search-result__code']}>{productCode.ProductBase.code}</div>
												<div className={styles['search-result__name']}>{productCode.ProductBase.name}</div>
											</section>
											<section className={styles['search-result__field']}>
												<div className={styles['search-result__code']}>{productCode.ProductSize.code}</div>
												<div className={styles['search-result__name']}>{productCode.ProductSize.name}</div>
											</section>
											<section className={styles['search-result__field']}>
												<div className={styles['search-result__code']}>{productCode.ProductVariant.code}</div>
												<div className={styles['search-result__name']}>{productCode.ProductVariant.name}</div>
											</section>
										</li>
									)
								}
							</ul>
						</>
						: <span className={styles['search-results__info']}>
							No results.
						</span>
					: null
				}
			</div>
			{
				selectedProductCode
					? <section className={styles['selected-product']}>
						<h3 className={styles['selected-product__header']}>Selected Product</h3>
						<section className={styles['search-result__field']}>
							<div className={styles['search-result__code']}>{selectedProductCode.ProductBase.code}</div>
							<div className={styles['search-result__name']}>{selectedProductCode.ProductBase.name}</div>
						</section>
						<section className={styles['search-result__field']}>
							<div className={styles['search-result__code']}>{selectedProductCode.ProductSize.code}</div>
							<div className={styles['search-result__name']}>{selectedProductCode.ProductSize.name}</div>
						</section>
						<section className={styles['search-result__field']}>
							<div className={styles['search-result__code']}>{selectedProductCode.ProductVariant.code}</div>
							<div className={styles['search-result__name']}>{selectedProductCode.ProductVariant.name}</div>
						</section>
					</section>
					: null
			}
			<section className={styles['modal-form__controls']}>
				<button
					className={styles['modal-form__button']}
					type="button"
					onClick={() => closeModal()}
					data-for="cancel"
				>
					Cancel
				</button>
				<button
					className={styles['modal-form__button']}
					type="button"
					onClick={() => closeModal(selectedProductCode)}
					disabled={!selectedProductCode}
				>
					Save
				</button>
			</section>
		</>
	);
};

export default ChooseProductModalForm;