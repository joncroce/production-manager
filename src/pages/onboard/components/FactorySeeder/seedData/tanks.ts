import type { TAddTankSchema } from '@/schemas/tank';
import type { Product } from '@prisma/client';

const TANK_CAPACITIES = [5_000, 7_500, 10_000];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getRandomTankCapacity = () => TANK_CAPACITIES[Math.floor(Math.random() * TANK_CAPACITIES.length)]!;

export const generateTanksForProduct =
	(
		product: Pick<Product, 'factoryId' | 'baseCode' | 'sizeCode' | 'variantCode' | 'quantityInStock'>,
		tankZone: string,
		tankNumberStart: number
	): TAddTankSchema[] => {
		const tanks: TAddTankSchema[] = [];

		for (
			let i = 0, quantityRemaining = Number(product.quantityInStock), capacity = getRandomTankCapacity();
			quantityRemaining > 0;
			quantityRemaining = quantityRemaining - capacity * 0.9,
			tankNumberStart++,
			i++
		) {
			const { factoryId, baseCode, sizeCode, variantCode } = product;
			const name = `${tankZone}-${tankNumberStart.toString().padStart(2, '0')}`;
			const heel = capacity * 0.05;
			const newTank: TAddTankSchema = {
				factoryId,
				name,
				baseCode,
				sizeCode,
				variantCode,
				capacity,
				heel,
				isDefaultSource: i === 0,
				quantity: Math.min(capacity * 0.9, quantityRemaining)
			};

			tanks.push(newTank);
		}

		return tanks;
	};