import { createTRPCRouter, publicProcedure } from '../trpc';
import schema from '@/schemas/variantCode';

export const variantCodeRouter = createTRPCRouter({
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.productVariantCode.findMany();
	}),
	add: publicProcedure
		.input(schema)
		.mutation(async ({ ctx, input }) => {
			const variantCode = await ctx.prisma.productVariantCode.create({
				data: input
			});

			return variantCode;
		})
});