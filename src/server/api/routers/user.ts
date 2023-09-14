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
	getTankViews: publicProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { userId } = input;

			const tankViews = ctx.prisma.user.findUnique({
				where: {
					id: userId
				},
				include: {
					ViewingTanks: {
						include: {
							Tank: true
						}
					}
				}
			});

			return tankViews;
		}),
	addTankView: publicProcedure
		.input(z.object({ userId: z.string(), factoryId: z.string(), tankName: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { userId, factoryId, tankName } = input;

			return ctx.prisma.usersOnTanks.upsert({
				where: {
					userId_factoryId_tankName: {
						userId, factoryId, tankName
					}
				},
				update: {
					userId, factoryId, tankName
				},
				create: {
					userId,
					factoryId,
					tankName
				}
			});
		}),
	removeTankView: publicProcedure
		.input(z.object({ userId: z.string(), factoryId: z.string(), tankName: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { userId, factoryId, tankName } = input;

			return ctx.prisma.usersOnTanks.delete({
				where: {
					userId_factoryId_tankName: {
						userId, factoryId, tankName
					}
				}
			});
		})
});

export type UserRouter = typeof userRouter;