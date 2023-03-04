import { prisma } from '../src/server/db';
import baseCodes from './seedData/baseCodes';
import sizeCodes from './seedData/sizeCodes';
import variantCodes from './seedData/variantCodes';
import products from './seedData/products';

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