import { createTRPCRouter, publicProcedure } from "../trpc";
import schema from '@/schemas/product';

export const productRouter = createTRPCRouter({

	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.product.findMany();
	}),
	add: publicProcedure
		.input(schema)
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
