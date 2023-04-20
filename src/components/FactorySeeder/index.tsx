import styles from './index.module.css';
import { useState } from 'react';
import { api } from '@/utils/api';
import productBases, { BaseOilCategorizer } from './seedData/productBases';
import productSizes from './seedData/productSizes';
import productVariants from './seedData/productVariants';
import products from './seedData/products';
import { generateTanksForProduct } from './seedData/tanks';
import { generateRandomBlendFormula } from './seedData/blendFormulas';
import type { TAddTankSchema } from '@/schemas/tank';
import type { TAddFormulaSchema } from '@/schemas/formula';
import type {
	Formula as TFormula,
	Product as TProduct,
	ProductBase as TProductBase,
	ProductSize as TProductSize,
	ProductVariant as TProductVariant,
	Tank as TTank
} from '@prisma/client';
import Link from 'next/link';

const FactorySeeder: React.FC<{ factoryId: string; }> = ({ factoryId }) => {
	const [seedLog, setSeedLog] = useState<{ type: 'success' | 'error'; message: string; }[]>([]);
	const [seeding, setSeeding] = useState(false);
	const [seeded, setSeeded] = useState(false);
	const [error, setError] = useState(false);

	const addProductBases = api.productBase.addMany.useMutation();
	const seedBaseCodes = (factoryId: string) =>
		new Promise<TProductBase[]>((resolve, reject) =>
			addProductBases.mutate(productBases.map((baseCode) => ({ ...baseCode, factoryId })), {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data.length} Base Codes.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			})
		);

	const addProductSizes = api.productSize.addMany.useMutation();
	const seedSizeCodes = (factoryId: string) =>
		new Promise<TProductSize[]>((resolve, reject) =>
			addProductSizes.mutate(productSizes.map((sizeCode) => ({ ...sizeCode, factoryId })), {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data.length} Size Codes.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			})
		);

	const addProductVariants = api.productVariant.addMany.useMutation();
	const seedVariantCodes = (factoryId: string) =>
		new Promise<TProductVariant[]>((resolve, reject) =>
			addProductVariants.mutate(productVariants.map((variantCode) => ({ ...variantCode, factoryId })), {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data.length} Variant Codes.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			})
		);

	const addProducts = api.product.addMany.useMutation();
	const seedProducts = (factoryId: string) =>
		new Promise<TProduct[]>((resolve, reject) =>
			addProducts.mutate(products.map((product) => ({ ...product, factoryId })), {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data.length} Products.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			})
		);

	type TBulkProduct = Omit<TProduct, 'sizeCode' | 'variantCode'> & { sizeCode: 1; variantCode: 0; };
	const addTanksForBulkProducts = api.tank.addTanks.useMutation();
	const seedTanksForBulkProducts = (products: TBulkProduct[]) =>
		new Promise<TTank[]>((resolve, reject) => {

			let tanksToAdd: TAddTankSchema[] = [];
			let tankZone = 'A';
			let tankNumber = 1;

			for (const {
				factoryId,
				baseCode,
				sizeCode,
				variantCode,
				quantityInStock
			} of products) {
				const generatedTanks = generateTanksForProduct(
					{ factoryId, baseCode, sizeCode, variantCode, quantityInStock },
					tankZone,
					tankNumber
				);

				tanksToAdd = tanksToAdd.concat(generatedTanks);
				tankNumber += generatedTanks.length;
				if (tankNumber > 40) {
					tankNumber = 1;
					tankZone = String.fromCharCode(tankZone.charCodeAt(0) + 1);
				}
			}

			return addTanksForBulkProducts.mutate(tanksToAdd, {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data.length} Tanks.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			});
		});

	const addFormulasForBulkProducts = api.formula.addFormulas.useMutation();
	const seedFormulasForBulkProducts = (products: TBulkProduct[]) =>
		new Promise<TFormula[]>((resolve, reject) => {
			let formulasToAdd: TAddFormulaSchema[] = [];

			for (const {
				factoryId,
				baseCode,
				sizeCode,
				variantCode
			} of products) {
				// Generate formulas only for select categories
				if (
					[
						BaseOilCategorizer.isMotorOil,
						BaseOilCategorizer.isHeavyDutyMotorOil,
						BaseOilCategorizer.isHydraulicFluid,
						BaseOilCategorizer.isGearOil,
						BaseOilCategorizer.isTransmissionFluid
					]
						.map((fn) => fn.apply(undefined, [baseCode]))
						.includes(true)
				) {
					const generatedFormulas = Array.from(
						{ length: 2 },
						() => generateRandomBlendFormula({ factoryId, baseCode, sizeCode, variantCode })
					);

					formulasToAdd = formulasToAdd.concat(generatedFormulas);
				}
			}

			return addFormulasForBulkProducts.mutate(formulasToAdd, {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data.length} Formulas.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			});
		});

	const seedFactory = async () => {
		await seedBaseCodes(factoryId)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Base Codes'); });

		await seedSizeCodes(factoryId)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Size Codes'); });

		await seedVariantCodes(factoryId)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Variant Codes'); });

		const products = await seedProducts(factoryId)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Products'); });

		const bulkProducts = products
			? products.filter((product) => product.sizeCode === 1 && product.variantCode === 0) as TBulkProduct[]
			: [];

		await seedTanksForBulkProducts(bulkProducts)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Tanks'); });

		await seedFormulasForBulkProducts(bulkProducts)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Formulas'); });

	};

	const startSeeding = async () => {
		setSeeding(true);
		await seedFactory()
			.then(() => {
				setSeeded(true);
			})
			.catch((error) => {
				setError(true);
				console.error(error);
			});
	};

	return (
		<section className={styles['factory-seeder']}>
			<h3 className={styles['factory-seeder__header']}>Factory Seeder</h3>
			{seeding
				? <SeedLog seedLog={seedLog} />
				: <button
					className={styles['factory-seeder__button']}
					type="button"
					onClick={() => startSeeding()}>
					Seed Factory
				</button>
			}
			{
				<p className={styles['factory-seeder__status']}>
					{seeded
						? 'Factory Seeded!'
						: error
							? 'Error seeding factory.'
							: null
					}
				</p>
			}
			{seeded
				? <Link href="/dashboard">Go to Dashboard</Link>
				: null
			}
		</section>
	);
};

export default FactorySeeder;

const SeedLog: React.FC<{ seedLog: { type: 'error' | 'success'; message: string; }[]; }> = ({ seedLog }) =>
	<ul>
		{
			seedLog.map((logEntry, i) =>
				<li key={`${logEntry.message}-${i}`}>
					<span><strong>{logEntry.type}</strong>: {logEntry.message}</span>
				</li>
			)
		}
	</ul>;