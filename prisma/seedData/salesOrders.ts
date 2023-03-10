import type { SalesOrder, SalesOrderItem } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import products from './products';

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
	return {
		orderedOn: new Date(),
		readyOn: null,
		shippedOn: null,
		deliveredOn: null,
		readyTarget: null,
		shippedTarget: null,
		deliveredTarget: null,
		notes: ''
	};
};

const generateRandomInteger = (min = 1, max = 200) => min + Math.floor(Math.random() * (max - min));