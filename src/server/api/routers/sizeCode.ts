import { createTRPCRouter, publicProcedure } from '../trpc';
import schema from '@/schemas/sizeCode';

export const sizeCodeRouter = createTRPCRouter({
	getAll: publicProcedure.query(({ ctx }) => {
		return ctx.prisma.productSizeCode.findMany();
	}),
	add: publicProcedure
		.input(schema)
		.mutation(async ({ ctx, input }) => {
			const sizeCode = await ctx.prisma.productSizeCode.create({
				data: input
			});

			return sizeCode;
		})
});