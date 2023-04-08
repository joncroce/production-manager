import styles from './chooseBaseCodeModalForm.module.css';
import React, { useState } from 'react';
import { useZodForm } from '@/hooks/useZodForm';
import { z } from 'zod';
import Form from '@/components/Form';
import type { MouseEventHandler } from 'react';
import type { UseFormReturn, SubmitHandler } from 'react-hook-form';
import type { ProductBaseCode } from '@prisma/client';

const searchFormSchema = z.object({
	searchTerm: z.string(),
	searchField: z.enum(['id', 'name'])
});

const ChooseBaseCodeModalForm: React.FC<
	{
		fieldId: string;
		availableBaseCodes?: ProductBaseCode[];
		closeModal: (selectedBaseCodeId?: number) => void;
	}
> = ({ availableBaseCodes, closeModal }) => {
	const [searchResults, setSearchResults] = useState<ProductBaseCode[]>();
	const [selectedBaseCode, setSelectedBaseCode] = useState<ProductBaseCode>();

	const form = useZodForm({
		schema: searchFormSchema,
		defaultValues: {
			searchTerm: '',
			searchField: 'id'
		}
	});

	const submitSearchForm: SubmitHandler<z.infer<typeof searchFormSchema>> = ({ searchTerm, searchField }) => {
		const matches = searchAvailableBaseCodes(searchTerm, searchField);
		if (matches) {
			setSearchResults(matches);
		}
	};

	const searchAvailableBaseCodes = (searchTerm: string, searchField: 'id' | 'name') => {
		if (availableBaseCodes && availableBaseCodes.length) {
			if (!searchTerm.length) {
				return availableBaseCodes;
			}

			return availableBaseCodes.filter((baseCode) => {
				if (searchField === 'id')
					return String(baseCode.id).includes(searchTerm.trim());
				if (searchField === 'name') {
					return baseCode.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
				}
				return false;
			});
		}
	};

	return (
		<>
			<SearchForm form={form} submitHandler={submitSearchForm} />
			<SearchResults
				searchTerm={form.getValues('searchTerm')}
				searchResults={searchResults}
				selectedBaseCode={selectedBaseCode}
				setSelectedBaseCode={setSelectedBaseCode}
			/>
			<SelectedBaseCode
				baseCode={selectedBaseCode}
				hidden={!searchResults || !searchResults.length}
			/>
			<ModalFormControls
				handleCancel={() => closeModal()}
				handleSave={() => closeModal(selectedBaseCode?.id)}
				saveDisabled={!Boolean(selectedBaseCode)}
			/>
		</>
	);
};

export default ChooseBaseCodeModalForm;

const SearchForm: React.FC<
	{
		form: UseFormReturn<
			{
				searchTerm: string;
				searchField: "id" | "name";
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			any
		>;
		submitHandler: SubmitHandler<z.infer<typeof searchFormSchema>>;
	}
> = ({ form, submitHandler }) => (
	<Form className={styles['search-form']} form={form} onSubmit={submitHandler}>
		<div className={styles['search-form__row']}>
			<span className={styles['search-form__label']}>Search Field</span>
			<label className={styles['search-form__label']} htmlFor="searchField-id">
				<input
					className={styles['search-form__input']}
					type="radio" value="id" id="searchField-id" {...form.register('searchField')}
				/>
				ID
			</label>
			<label className={styles['search-form__label']} htmlFor="searchField-name">
				<input className={styles['search-form__input']} type="radio" value="name" id="searchField-name" {...form.register('searchField')} />
				Name
			</label>
		</div>
		<div className={styles['search-form__row']}>
			<input className={styles['search-form__input']} type="text" aria-label="Search Term" {...form.register('searchTerm')} />
			<button className={styles['search-form__submit']} type="submit">Search 🔎</button>
		</div>
	</Form>
);

const SearchResults: React.FC<
	{
		searchTerm: string;
		searchResults?: ProductBaseCode[];
		selectedBaseCode?: ProductBaseCode;
		setSelectedBaseCode: React.Dispatch<React.SetStateAction<ProductBaseCode | undefined>>;
	}
> = ({ searchTerm, searchResults, selectedBaseCode, setSelectedBaseCode }) => (
	<div className={styles['search-results']}>
		{searchResults
			? searchResults.length
				? <ul className={styles['search-results__list']}>
					{
						searchResults.map((baseCode, i) =>
							<li
								className={
									[
										styles['search-results__list-item'],
										selectedBaseCode && selectedBaseCode.id === baseCode.id ? styles['search-results__list-item--selected'] : '',
										styles['search-result'],
									].join(' ')
								}
								key={`${baseCode.id}-${i}`}
								onClick={() => setSelectedBaseCode(baseCode)}
							>
								<div className={styles['search-result__id']}>{baseCode.id}</div>
								<div className={styles['search-result__name']}>{baseCode.name}</div>
							</li>
						)
					}
				</ul>
				: <span className={styles['search-results__info']}>
					No results for {'\u201c' + searchTerm + '\u201d'}
				</span>
			: null
		}
	</div>
);

const SelectedBaseCode: React.FC<
	{
		baseCode?: ProductBaseCode;
		hidden: boolean;
	}
> = ({ baseCode, hidden }) => (
	!hidden
		? baseCode
			? <p>Selected: <strong>{baseCode.id}</strong> {baseCode.name}</p>
			: <p>Please select a Base Code from the above results.</p>
		: null
);

const ModalFormControls: React.FC<
	{
		handleCancel: MouseEventHandler;
		handleSave: MouseEventHandler;
		saveDisabled: boolean;
	}
> = ({ handleCancel, handleSave, saveDisabled }) => (
	<div className={styles['modal-form-controls']}>
		<button className={styles['modal-form-controls__cancel']} type="button" onClick={handleCancel}>Cancel</button>
		<button className={styles['modal-form-controls__save']} type="button" onClick={handleSave} disabled={saveDisabled}>Save</button>
	</div>
);