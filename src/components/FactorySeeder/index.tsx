import styles from './index.module.css';
import Link from 'next/link';
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
import type { TAddBlendSchema } from '@/schemas/blend';
import type {
	Blend as TBlend,
	Product as TProduct,
	ProductBase as TProductBase,
	ProductSize as TProductSize,
	ProductVariant as TProductVariant,
	Tank as TTank
} from '@prisma/client';
import type { TFormulaWithComponents } from '@/server/api/routers/formula';

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
		new Promise<TFormulaWithComponents[]>((resolve, reject) => {
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

	const addBlends = api.blend.addMany.useMutation();
	const seedBlends = (formulas: void | TFormulaWithComponents[], tanks: void | TTank[]) => {
		return new Promise<void | TBlend[]>((resolve, reject) => {

			const findTankByProductCode = (tanks: TTank[], productCode: { baseCode: number; sizeCode: number; variantCode: number; }) =>
				tanks.find((tank) =>
					tank.baseCode === productCode.baseCode
					&& tank.sizeCode === productCode.sizeCode
					&& tank.variantCode === productCode.variantCode
				);

			const blendsToAdd: TAddBlendSchema[] = [];

			if (formulas && tanks) {
				for (const {
					factoryId,
					id,
					baseCode,
					sizeCode,
					variantCode,
					Components
				} of formulas) {
					const destinationTankName = findTankByProductCode(tanks, { baseCode, sizeCode, variantCode })?.name;
					const targetQuantity = Math.ceil(Math.random() * 50) * 100;
					const components = Components.map((component) => ({
						formulaComponentId: component.id,
						sourceTankName: findTankByProductCode(
							tanks,
							{ baseCode: component.baseCode, sizeCode: component.sizeCode, variantCode: component.variantCode }
						)?.name,
						targetQuantity: targetQuantity * Number(component.proportion)
					}));

					if (destinationTankName && components.every((component) => typeof component.sourceTankName === 'string')) {
						const generatedBlend: TAddBlendSchema = {
							factoryId,
							formulaId: id,
							targetQuantity,
							status: "CREATED",
							destinationTankName,
							// @ts-expect-error sourceTankName type already ensured to be string
							components
						};

						blendsToAdd.push(generatedBlend);
					}
				}
			}

			return addBlends.mutate(blendsToAdd, {
				onSuccess(data) {
					setSeedLog((prev) => [...prev, { type: 'success', message: `Added ${data?.length ?? 0} Blends.` }]);
					resolve(data);
				},
				onError(error) {
					setSeedLog((prev) => [...prev, { type: 'error', message: error.message }]);
					reject(error);
				}
			});

		});
	};

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

		const tanks = await seedTanksForBulkProducts(bulkProducts)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Tanks'); });

		const formulas = await seedFormulasForBulkProducts(bulkProducts)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Formulas'); });

		await seedBlends(formulas, tanks)
			.then((data) => data)
			.catch((error: { message?: string; }) => { console.error(error?.message ?? 'Error adding Blends'); });
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