import { createTRPCRouter, publicProcedure } from "../trpc";
import { addProductSchema } from '@/schemas/product';

export const productRouter = createTRPCRouter({

	getAll: publicProcedure.query(({ ctx }) =>
		ctx.prisma.product.findMany({
			include: {
				Code: {
					include: {
						BaseCode: true,
						SizeCode: true,
						VariantCode: true
					}
				}
			}
		})
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

export type ProductRouter = typeof productRouter;