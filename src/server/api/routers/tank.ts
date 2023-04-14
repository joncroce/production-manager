import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const tankRouter = createTRPCRouter({
	getTanksByBaseCodeIds: publicProcedure
		.input(z.object({ baseCodeIds: z.array(z.coerce.number()) }))
		.query(({ ctx, input }) => {
			const { baseCodeIds } = input ?? [];
			if (!baseCodeIds.length) {
				return null;
			}

			return ctx.prisma.tank.findMany({
				where: {
					baseCodeId: {
						in: baseCodeIds
					}
				},
				include: {
					Product: true
				}
			});

		})
});