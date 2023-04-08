import type { Product, Tank } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';

const TANK_CAPACITIES = [5_000, 7_500, 10_000];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getRandomTankCapacity = () => TANK_CAPACITIES[Math.floor(Math.random() * TANK_CAPACITIES.length)]!;

export const generateTanksForProduct =
	(
		product: Pick<Product, 'baseCodeId' | 'sizeCodeId' | 'variantCodeId' | 'quantityInStock'>,
		tankZone: string,
		tankNumberStart: number
	): Tank[] => {
		const tanks: Tank[] = [];

		for (
			let i = 0, quantityRemaining = product.quantityInStock, capacity = new Decimal(getRandomTankCapacity());
			quantityRemaining.greaterThan(0);
			quantityRemaining = quantityRemaining.minus(capacity.mul(0.9)),
			tankNumberStart++,
			i++
		) {
			const { baseCodeId, sizeCodeId, variantCodeId } = product;
			const id = `${tankZone}-${tankNumberStart.toString().padStart(2, '0')}`;
			const heel = capacity.mul(0.05);
			const newTank: Tank = {
				id,
				baseCodeId,
				sizeCodeId,
				variantCodeId,
				capacity,
				heel,
				isDefaultSource: i === 0,
				quantity: new Decimal(Math.min(capacity.mul(0.9).toNumber(), quantityRemaining.toNumber()))
			};

			tanks.push(newTank);
		}

		return tanks;
	};