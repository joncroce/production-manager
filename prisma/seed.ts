import { prisma } from '../src/server/db';
import baseCodes, { BaseOilCategorizer } from './seedData/baseCodes';
import sizeCodes from './seedData/sizeCodes';
import variantCodes from './seedData/variantCodes';
import products from './seedData/products';
import customers from './seedData/customers';
import { generateRandomAddress } from './seedData/addresses';
import { generateRandomSalesOrder, generateRandomSalesOrderItem } from './seedData/salesOrders';
import { generateTanksForProduct } from './seedData/tanks';
import { generateRandomBlendFormula } from './seedData/blendFormulas';

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

	// Upsert Products (and related Tanks for Bulk Unlabeled Products)

	let tankZone = 'A';
	let tankNumber = 1;

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

		if (sizeCodeId === 1 && variantCodeId === 0) {
			const tanks = generateTanksForProduct({
				baseCodeId, sizeCodeId, variantCodeId, quantityInStock
			}, tankZone, tankNumber);

			for await (const {
				id,
				quantity,
				capacity,
				heel,
				isDefaultSource
			} of tanks) {
				await prisma.tank.upsert({
					where: { id },
					create: {
						id,
						quantity,
						capacity,
						heel,
						isDefaultSource,
						Product: {
							connect: {
								baseCodeId_sizeCodeId_variantCodeId: {
									baseCodeId, sizeCodeId, variantCodeId
								}
							}
						}
					},
					update: {},
				});
			}

			tankNumber += tanks.length;
			if (tankNumber > 40) {
				tankNumber = 1;
				tankZone = String.fromCharCode(tankZone.charCodeAt(0) + 1);
			}

			if (
				[
					BaseOilCategorizer.isMotorOil,
					BaseOilCategorizer.isHeavyDutyMotorOil,
					BaseOilCategorizer.isHydraulicFluid,
					BaseOilCategorizer.isGearOil,
					BaseOilCategorizer.isTransmissionFluid
				]
					.map((fn) => fn.apply(undefined, [baseCodeId]))
					.includes(true)
			) {

				const blendFormulas = Array.from({ length: 2 }, () => generateRandomBlendFormula(baseCodeId));
				for await (const blendFormula of blendFormulas) {
					await prisma.blendFormula.create({
						data: {
							BlendableProduct: {
								connectOrCreate: {
									where: {
										baseCodeId_sizeCodeId_variantCodeId: {
											baseCodeId, sizeCodeId, variantCodeId
										}
									},
									create: {
										baseCodeId, sizeCodeId, variantCodeId
									}
								}
							},
							Components: {
								create: blendFormula.formulaComponents
							}
						}
					});
				}
			}
		}
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

			// Create 1-30 random sales orders with 1-10 sales order items each
			for (let i = 0; i < Math.ceil(Math.random() * 30); i++) {
				const randomSalesOrder = generateRandomSalesOrder();
				const salesOrder = await tx.salesOrder.create({
					data: {
						Customer: {
							connect: {
								id: customer.id
							}
						},
						...randomSalesOrder
					}
				});

				// Create 1-10 random sales order items for each order
				for (let j = 0; j < Math.ceil(Math.random() * 10); j++) {
					const { baseCodeId, sizeCodeId, variantCodeId, ...randomSalesOrderItem } = generateRandomSalesOrderItem();
					await tx.salesOrderItem.create({
						data: {
							Order: {
								connect: {
									id: salesOrder.id
								}
							},
							Product: {
								connect: {
									baseCodeId_sizeCodeId_variantCodeId: {
										baseCodeId, sizeCodeId, variantCodeId
									}
								}
							},
							...randomSalesOrderItem
						}
					});
				}
			}

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