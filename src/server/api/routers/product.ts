import { createTRPCRouter, publicProcedure } from "../trpc";
import { addProductSchema } from '@/schemas/product';
import { addProductCode } from '@/utils/product';

export const productRouter = createTRPCRouter({

	getAll: publicProcedure.query(({ ctx }) =>
		ctx.prisma.product.findMany()
			.then((products) => products.map(addProductCode))
	),
	add: publicProcedure
		.input(addProductSchema)
		.mutation(async ({ ctx, input }) => {
			const { baseCodeId, sizeCodeId, variantCodeId, ...inputValues } = input;
			const product = await ctx.prisma.product.create({
				data: {
					Code: {
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
							}
						}
					},
					...inputValues
				}
			});
			return product;
		})
});
