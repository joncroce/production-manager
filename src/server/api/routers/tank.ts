import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addTankSchema } from '@/schemas/tank';
import type { Tank } from '@prisma/client';

export const tankRouter = createTRPCRouter({
	getAll: publicProcedure
		.input(z.object({
			userId: z.string(),
			factoryId: z.string(),
			orderBy: z.array(z.object({
				name: z.enum(['asc', 'desc']).optional(),
				baseCode: z.enum(['asc', 'desc']).optional(),
				quantity: z.enum(['asc', 'desc']).optional(),
				capacity: z.enum(['asc', 'desc']).optional(),
				heel: z.enum(['asc', 'desc']).optional(),
				isBlendTank: z.enum(['asc', 'desc']).optional()
			})).optional(),
			where: z.object({
				name: z.string().optional(),
				isBlendTank: z.boolean().optional(),

			}).optional()
		}))
		.query(({ ctx, input }) => {
			const where = {
				factoryId: input.factoryId,
				name: input.where?.name !== undefined ? {
					contains: input.where.name
				} : undefined,
				isBlendTank: input.where?.isBlendTank !== undefined ? {
					equals: true
				} : undefined,
			};
			return ctx.prisma.tank.findMany({
				where: Object.fromEntries(Object.entries(where).filter(([, value]) => value !== undefined)),
				include: {
					UsersViewing: true
				},
				orderBy: input.orderBy
			});
		}),
	getTanksByBaseCodes: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			baseCodes: z.array(z.coerce.number())
		}))
		.query(({ ctx, input }) => {
			const { factoryId, baseCodes } = input;

			if (!factoryId || !baseCodes.length) {
				return null;
			}

			return ctx.prisma.tank.findMany({
				where: {
					factoryId,
					baseCode: {
						in: baseCodes
					}
				},
				include: {
					Product: true
				}
			});
		}),
	getBlendTanks: publicProcedure
		.input(z.object({
			factoryId: z.string(),
		}))
		.query(({ ctx, input }) => {
			return ctx.prisma.tank.findMany({
				where: {
					factoryId: input.factoryId,
					isBlendTank: {
						equals: true
					}
				}
			});
		}),
	addTanks: publicProcedure
		.input(z.array(addTankSchema))
		.mutation(async ({ ctx, input }) => {
			const tanks: Tank[] = [];

			for await (const {
				factoryId,
				baseCode,
				sizeCode,
				variantCode,
				name,
				quantity,
				capacity,
				heel,
				isDefaultSource
			} of input) {
				const tank = await ctx.prisma.tank.create({
					data: {
						Factory: {
							connect: {
								id: factoryId
							}
						},
						Product: {
							connect: {
								factoryId_baseCode_sizeCode_variantCode: {
									factoryId, baseCode, sizeCode, variantCode
								}
							}
						},
						name,
						quantity,
						capacity,
						heel,
						isDefaultSource
					}
				});

				tanks.push(tank);
			}

			return tanks;
		})
});

export type TankRouter = typeof tankRouter;