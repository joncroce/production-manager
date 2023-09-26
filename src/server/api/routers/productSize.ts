import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { addProductCodePartSchema } from '@/schemas/product';
import type { ProductSize } from '@prisma/client';
import type { inferRouterOutputs } from '@trpc/server';

export const productSizeRouter = createTRPCRouter({
	getAll: publicProcedure
		.input(z.object({ factoryId: z.string() }))
		.query(({ ctx, input }) => {
			return ctx.prisma.productSize.findMany({ where: { factoryId: input.factoryId } });
		}),
	add: publicProcedure
		.input(addProductCodePartSchema)
		.mutation(async ({ ctx, input }) => {
			const sizeCode = await ctx.prisma.productSize.create({
				data: input
			});

			return sizeCode;
		}),
	addMany: publicProcedure
		.input(z.array(addProductCodePartSchema))
		.mutation(async ({ ctx, input }) => {
			const sizeCodes: ProductSize[] = [];

			for await (const { factoryId, code, name, description } of input) {
				const sizeCode = await ctx.prisma.productSize.upsert(
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

				sizeCodes.push(sizeCode);
			}

			return sizeCodes;
		})
});

export type ProductSizeRouterOutputs = inferRouterOutputs<typeof productSizeRouter>;