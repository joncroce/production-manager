import type { SalesOrder, SalesOrderItem } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import products from './products';
import dayjs from 'dayjs';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getRandomProduct = () => products[Math.floor(Math.random() * products.length)]!;

export const generateRandomSalesOrderItem = (): Omit<SalesOrderItem, 'id' | 'orderId'> => {
	const { baseCodeId, sizeCodeId, variantCodeId, salesPrice } = getRandomProduct();

	return {
		baseCodeId,
		sizeCodeId,
		variantCodeId,
		quantity: new Decimal(generateRandomInteger()),
		pricePerUnit: salesPrice ?? new Decimal(generateRandomInteger()),
		notes: ''
	};
};

export const generateRandomSalesOrder = (): Omit<SalesOrder, 'id' | 'customerId'> => {
	// Ordered on random day up to 30 days ago
	const orderedDaysAgo = generateRandomInteger(0, 30);
	let daysToOrderReady: number | null = getRandomArrayValue(probabilityDistribution);
	if (orderedDaysAgo - daysToOrderReady < 0) {
		daysToOrderReady = null;
	}
	let daysToOrderShipped: number | null = getRandomArrayValue(probabilityDistribution);
	if (daysToOrderReady === null || orderedDaysAgo - daysToOrderReady - daysToOrderShipped < 0) {
		daysToOrderShipped = null;
	}
	let daysToOrderDelivered: number | null = getRandomArrayValue(probabilityDistribution);
	if (daysToOrderReady === null || daysToOrderShipped === null || orderedDaysAgo - daysToOrderReady - daysToOrderShipped - daysToOrderDelivered < 0) {
		daysToOrderDelivered = null;
	}

	const orderedOn = dayjs().subtract(orderedDaysAgo, 'day');
	const readyOn = daysToOrderReady !== null ? orderedOn.add(daysToOrderReady, 'day') : null;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const shippedOn = daysToOrderShipped !== null ? readyOn!.add(daysToOrderShipped, 'day') : null;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const deliveredOn = daysToOrderDelivered !== null ? shippedOn!.add(daysToOrderDelivered, 'day') : null;

	return {
		orderedOn: orderedOn.toDate(),
		readyOn: readyOn !== null ? readyOn.toDate() : null,
		shippedOn: shippedOn !== null ? shippedOn.toDate() : null,
		deliveredOn: deliveredOn !== null ? deliveredOn.toDate() : null,
		readyTarget: null,
		shippedTarget: null,
		deliveredTarget: null,
		notes: ''
	};
};

const generateRandomInteger = (min = 1, max = 200) => min + Math.floor(Math.random() * (max - min));
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getRandomArrayValue = (arr: unknown[]) => arr[generateRandomInteger(0, arr.length - 1)] as number;

// Numbers 1-30 with increasing incidence of lower values
const probabilityDistribution = Array
	.from({ length: 30 }, (_, k) => k + 1)
	.reduce(
		(result, cur) =>
			result.concat(Array.from({ length: Math.floor(30 - cur) }, () => cur)),
		[] as number[]
	);