import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addProductCodePartSchema } from '@/schemas/product';
import type { ProductBase } from '@prisma/client';
import type { inferRouterOutputs } from '@trpc/server';

export const productBaseRouter = createTRPCRouter({
	getAll: publicProcedure
		.input(z.object({ factoryId: z.string() }))
		.query(({ ctx, input }) => {
			if (input.factoryId)
				return ctx.prisma.productBase.findMany({ where: { factoryId: input.factoryId } });
		}),
	add: publicProcedure
		.input(addProductCodePartSchema)
		.mutation(async ({ ctx, input }) => {
			const baseCode = await ctx.prisma.productBase.create({
				data: input
			});

			return baseCode;
		}),
	addMany: publicProcedure
		.input(z.array(addProductCodePartSchema))
		.mutation(async ({ ctx, input }) => {
			const baseCodes: ProductBase[] = [];

			for await (const { factoryId, code, name, description } of input) {
				const baseCode = await ctx.prisma.productBase.upsert(
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

				baseCodes.push(baseCode);
			}

			return baseCodes;
		})
});

export type ProductBaseRouter = typeof productBaseRouter;
export type ProductBaseRouterOutputs = inferRouterOutputs<ProductBaseRouter>;