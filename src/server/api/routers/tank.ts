import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addTankSchema } from '@/schemas/tank';
import type { Tank } from '@prisma/client';

export const tankRouter = createTRPCRouter({
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