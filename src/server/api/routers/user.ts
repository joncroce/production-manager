import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
	getFactory: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = input;

			const factory = ctx.prisma.user.findUnique({
				where: {
					id: userId
				},
				include: {
					Factory: true
				}
			});

			return factory;
		}),
});