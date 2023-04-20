import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addProductCodePartSchema } from '@/schemas/product';
import type { ProductVariant } from '@prisma/client';

export const productVariantRouter = createTRPCRouter({
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.productVariant.findMany();
	}),
	add: publicProcedure
		.input(addProductCodePartSchema)
		.mutation(async ({ ctx, input }) => {
			const variantCode = await ctx.prisma.productVariant.create({
				data: input
			});

			return variantCode;
		}),
	addMany: publicProcedure
		.input(z.array(addProductCodePartSchema))
		.mutation(async ({ ctx, input }) => {
			const variantCodes: ProductVariant[] = [];

			for await (const { factoryId, code, name, description } of input) {
				const variantCode = await ctx.prisma.productVariant.upsert(
					{
						where: {
							factoryId_code: {
								factoryId, code
							}
						},
						create: { factoryId, code, name, description },
						update: {}
					}
				);

				variantCodes.push(variantCode);
			}

			return variantCodes;
		})
});