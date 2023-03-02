import { createTRPCRouter, publicProcedure } from '../trpc';
import schema from '@/schemas/baseCode';

export const baseCodeRouter = createTRPCRouter({
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.productBaseCode.findMany();
	}),
	add: publicProcedure
		.input(schema)
		.mutation(async ({ ctx, input }) => {
			const baseCode = await ctx.prisma.productBaseCode.create({
				data: input
			});

			return baseCode;
		})
});