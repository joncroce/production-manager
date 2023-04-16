import styles from './index.module.css';
import React from 'react';
import Form from '@/components/Form';
import { z } from 'zod';
import { useState } from 'react';
import { useZodForm } from '@/hooks/useZodForm';
import type { SubmitHandler } from 'react-hook-form';
import type {
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

type TSearchFormInput = z.infer<typeof searchFormSchema>;

const searchFormSchema = z.object({
	baseCodeSearchTerm: z.string(),
	baseCodeSearchField: z.enum(['id', 'name']),
	sizeCodeSearchTerm: z.string(),
	sizeCodeSearchField: z.enum(['id', 'name']),
	variantCodeSearchTerm: z.string(),
	variantCodeSearchField: z.enum(['id', 'name']),
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
			baseCodeSearchTerm: '',
			baseCodeSearchField: 'id',
			sizeCodeSearchTerm: '1',
			sizeCodeSearchField: 'id',
			variantCodeSearchTerm: '0',
			variantCodeSearchField: 'id',
		}
	});

	const submitSearchForm: SubmitHandler<TSearchFormInput> = (input: TSearchFormInput) => {
		const matches = searchProducts(input);
		if (matches) {
			setSearchResults(matches);
		}
	};

	const searchProducts = (input: TSearchFormInput) => {
		if (productCodes && productCodes.length) {
			const baseCodeSearchTerm = input.baseCodeSearchTerm.trim().toLowerCase();
			const sizeCodeSearchTerm = input.sizeCodeSearchTerm.trim().toLowerCase();
			const variantCodeSearchTerm = input.variantCodeSearchTerm.trim().toLowerCase();

			return productCodes.filter((productCode) => (
				(
					!baseCodeSearchTerm.length
					|| (input.baseCodeSearchField === 'id' && String(productCode.BaseCode.id).includes(baseCodeSearchTerm))
					|| (input.baseCodeSearchField === 'name' && productCode.BaseCode.name.toLowerCase().includes(baseCodeSearchTerm))
				)
				&& (
					!sizeCodeSearchTerm.length
					|| (input.sizeCodeSearchField === 'id' && String(productCode.SizeCode.id).includes(sizeCodeSearchTerm))
					|| (input.sizeCodeSearchField === 'name' && productCode.SizeCode.name.toLowerCase().includes(sizeCodeSearchTerm))
				)
				&& (
					!variantCodeSearchTerm.length
					|| (input.variantCodeSearchField === 'id' && String(productCode.VariantCode.id).includes(variantCodeSearchTerm))
					|| (input.variantCodeSearchField === 'name' && productCode.VariantCode.name.toLowerCase().includes(variantCodeSearchTerm))
				)
			));
		}
	};

	return (
		<>
			<Form className={styles['search-form']} form={form} onSubmit={submitSearchForm}>
				<div className={styles['search-form__row']}>
					<span className={styles['search-form__label']}>Search Field</span>
					<label className={styles['search-form__label']} htmlFor="baseCodeSearchField-id">
						<input
							className={styles['search-form__input']}
							type="radio" value="id" id="baseCodeSearchField-id" {...form.register('baseCodeSearchField')}
						/>
						ID
					</label>
					<label className={styles['search-form__label']} htmlFor="baseCodeSearchField-name">
						<input className={styles['search-form__input']} type="radio" value="name" id="baseCodeSearchField-name" {...form.register('baseCodeSearchField')} />
						Name
					</label>
				</div>
				<div className={styles['search-form__row']}>
					<label className={styles['search-form__label']} htmlFor="baseCodeSearchTerm">
						Base Code
						<input className={styles['search-form__input']} type="text" id="baseCodeSearchTerm" {...form.register('baseCodeSearchTerm')} />
					</label>
				</div>
				<div className={styles['search-form__row']}>
					<span className={styles['search-form__label']}>Search Field</span>
					<label className={styles['search-form__label']} htmlFor="sizeCodeSearchField-id">
						<input
							className={styles['search-form__input']}
							type="radio" value="id" id="sizeCodeSearchField-id" {...form.register('sizeCodeSearchField')}
						/>
						ID
					</label>
					<label className={styles['search-form__label']} htmlFor="sizeCodeSearchField-name">
						<input className={styles['search-form__input']} type="radio" value="name" id="sizeCodeSearchField-name" {...form.register('sizeCodeSearchField')} />
						Name
					</label>
				</div>
				<div className={styles['search-form__row']}>
					<label className={styles['search-form__label']} htmlFor="sizeCodeSearchTerm">
						Size Code
						<input className={styles['search-form__input']} type="text" id="sizeCodeSearchTerm" {...form.register('sizeCodeSearchTerm')} />
					</label>
				</div>
				<div className={styles['search-form__row']}>
					<span className={styles['search-form__label']}>Search Field</span>
					<label className={styles['search-form__label']} htmlFor="variantCodeSearchField-id">
						<input
							className={styles['search-form__input']}
							type="radio" value="id" id="variantCodeSearchField-id" {...form.register('variantCodeSearchField')}
						/>
						ID
					</label>
					<label className={styles['search-form__label']} htmlFor="variantCodeSearchField-name">
						<input className={styles['search-form__input']} type="radio" value="name" id="variantCodeSearchField-name" {...form.register('variantCodeSearchField')} />
						Name
					</label>
				</div>
				<div className={styles['search-form__row']}>
					<label className={styles['search-form__label']} htmlFor="variantCodeSearchTerm">
						Variant Code
						<input className={styles['search-form__input']} type="text" id="variantCodeSearchTerm" {...form.register('variantCodeSearchTerm')} />
					</label>
				</div>
				<div className={styles['search-form__row']}>
					<button className={styles['search-form__submit']} type="submit">Search 🔎</button>
				</div>
			</Form>
			<div className={styles['search-results']}>
				{searchResults
					? searchResults.length
						? <ul className={styles['search-results__list']}>
							{
								searchResults.map((productCode) =>
									<li
										className={
											[
												styles['search-results__list-item'],
												styles['search-result'],
												selectedProductCode
													&& selectedProductCode.BaseCode.id === productCode.BaseCode.id
													&& selectedProductCode.SizeCode.id === productCode.SizeCode.id
													&& selectedProductCode.VariantCode.id === productCode.VariantCode.id
													? styles['search-results__list-item--selected']
													: '',
											].join(' ')
										}
										key={`${productCode.BaseCode.id}-${productCode.SizeCode.id}-${productCode.VariantCode.id}`}
										onClick={() => setSelectedProductCode(productCode)}
									>
										<section>
											<p>Base Code</p>
											<div className={styles['search-result__id']}>{productCode.BaseCode.id}</div>
											<div className={styles['search-result__name']}>{productCode.BaseCode.name}</div>
										</section>

										<p>Size Code</p>
										<div className={styles['search-result__id']}>{productCode.SizeCode.id}</div>
										<div className={styles['search-result__name']}>{productCode.SizeCode.name}</div>

										<p>Variant Code</p>
										<div className={styles['search-result__id']}>{productCode.VariantCode.id}</div>
										<div className={styles['search-result__name']}>{productCode.VariantCode.name}</div>
									</li>
								)
							}
						</ul>
						: <span className={styles['search-results__info']}>
							No results.
						</span>
					: null
				}
			</div>
			<div className={styles['modal-form-controls']}>
				<button className={styles['modal-form-controls__cancel']} type="button" onClick={() => closeModal()}>Cancel</button>
				<button className={styles['modal-form-controls__save']} type="button" onClick={() => closeModal(selectedProductCode)} disabled={!selectedProductCode}>Save</button>
			</div>
		</>
	);
};

export default ChooseProductModalForm;