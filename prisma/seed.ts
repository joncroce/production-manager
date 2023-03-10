import { prisma } from '../src/server/db';
import baseCodes from './seedData/baseCodes';
import sizeCodes from './seedData/sizeCodes';
import variantCodes from './seedData/variantCodes';
import products from './seedData/products';
import customers from './seedData/customers';
import { generateRandomAddress } from './seedData/addresses';

async function main() {

	for await (const { id, name, description } of baseCodes) {
		await prisma.productBaseCode.upsert(
			{
				where: { id },
				create: { id, name, description },
				update: {}
			}
		);
	}

	for await (const { id, name, description } of sizeCodes) {
		await prisma.productSizeCode.upsert(
			{
				where: { id },
				create: { id, name, description },
				update: {}
			}
		);
	}

	for await (const { id, name, description } of variantCodes) {
		await prisma.productVariantCode.upsert(
			{
				where: { id },
				create: { id, name, description },
				update: {}
			}
		);
	}

	for await (const {
		baseCodeId,
		sizeCodeId,
		variantCodeId,
		description,
		quantityInStock,
		salesPrice
	} of products) {
		await prisma.product.upsert(
			{
				where: {
					baseCodeId_sizeCodeId_variantCodeId: {
						baseCodeId,
						sizeCodeId,
						variantCodeId
					}
				},
				create: {
					Code: {
						connectOrCreate: {
							where: {
								baseCodeId_sizeCodeId_variantCodeId: {
									baseCodeId,
									sizeCodeId,
									variantCodeId
								}
							},
							create: {
								BaseCode: {
									connect: {
										id: baseCodeId
									}
								},
								SizeCode: {
									connect: {
										id: sizeCodeId
									}
								},
								VariantCode: {
									connect: {
										id: variantCodeId
									}
								},
							}
						}
					},
					description,
					quantityInStock,
					salesPrice
				},
				update: {}
			}
		);
	}

	for await (const {
		name
	} of customers) {
		await prisma.$transaction(async (tx) => {
			let customer = await tx.customer.create({
				data: {
					name
				}
			});

			const billingAddress = await tx.address.create({
				data: {
					Customer: {
						connect: {
							id: customer.id
						}
					},
					...generateRandomAddress()
				}
			});

			// 50/50 chance of customer using same address for both billing and shipping
			const useBillingAddressAsShippingAddress = Boolean(Math.round(Math.random()));

			const shippingAddress = useBillingAddressAsShippingAddress
				? billingAddress
				: await tx.address.create({
					data: {
						Customer: {
							connect: {
								id: customer.id
							}
						},
						...generateRandomAddress()
					}
				});

			customer = await tx.customer.update({
				where: {
					id: customer.id
				},
				data: {
					DefaultBillingAddress: {
						connect: {
							id: billingAddress.id
						}
					},
					DefaultShippingAddress: {
						connect: {
							id: shippingAddress.id
						}
					}
				}
			});
		});
	}

}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (err) => {
		console.error(err);
		await prisma.$disconnect();
		process.exit(1);
	});