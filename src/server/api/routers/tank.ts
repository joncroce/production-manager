import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addTankSchema, updateTankSchema } from '@/schemas/tank';
import { Prisma, type Tank } from '@prisma/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { TRPCClientError } from '@trpc/client';

export const tankRouter = createTRPCRouter({
	getAll: publicProcedure
		.input(z.object({
			factoryId: z.string(),
		}))
		.query(({ ctx, input }) => {
			const where = {
				factoryId: input.factoryId,
			};

			return ctx.prisma.tank.findMany({ where });
		}),
	getTankByName: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			name: z.string()
		}))
		.query(({ ctx, input }) => {
			const where = {
				factoryId: input.factoryId,
				name: input.name
			};

			return ctx.prisma.tank.findFirst({
				where,
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
	getDestinationTanks: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			baseCode: z.coerce.number()
		}))
		.query(({ ctx, input }) => {
			return ctx.prisma.tank.findMany({
				where: {
					factoryId: input.factoryId,
					baseCode: input.baseCode
				}
			});
		}),
	updateTank: publicProcedure
		.input(updateTankSchema)
		.mutation(async ({ ctx, input }) => {
			const updatedTank = await ctx.prisma.tank.update({
				where: {
					name_factoryId: {
						name: input.name,
						factoryId: input.factoryId
					},
				},
				data: {
					...input,
					name: input.updatedName,
				}
			});

			return updatedTank;
		}),
	addTank: publicProcedure
		.input(addTankSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				factoryId,
				baseCode,
				sizeCode,
				variantCode,
				name,
				quantity,
				capacity,
				heel,
				isDefaultSource,
				isBlendTank
			} = input;

			return ctx.prisma.tank.create({
				data: {
					Factory: {
						connect: {
							id: factoryId
						}
					},
					Product: baseCode !== undefined ? {
						connect: {
							factoryId_baseCode_sizeCode_variantCode: {
								factoryId, baseCode, sizeCode, variantCode
							}
						}
					} : undefined,
					name,
					quantity,
					capacity,
					heel,
					isDefaultSource,
					isBlendTank
				}
			}).catch((e) => {
				if (e instanceof Prisma.PrismaClientKnownRequestError) {
					if (e.code === 'P2002') {
						throw new TRPCClientError(`Tank with name ${input.name} already exists in your factory.`);
					}
				}

				throw e;
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
				isDefaultSource,
				isBlendTank
			} of input) {
				const tank = await ctx.prisma.tank.create({
					data: {
						Factory: {
							connect: {
								id: factoryId
							}
						},
						Product: baseCode !== undefined ? {
							connect: {
								factoryId_baseCode_sizeCode_variantCode: {
									factoryId, baseCode, sizeCode, variantCode
								}
							}
						} : undefined,
						name,
						quantity,
						capacity,
						heel,
						isDefaultSource,
						isBlendTank
					}
				});

				tanks.push(tank);
			}

			return tanks;
		}),
	updateTankName: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			currentName: z.string(),
			newName: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.tank.update({
				where: {
					name_factoryId: {
						factoryId: input.factoryId,
						name: input.currentName
					}
				},
				data: {
					name: input.newName,
					updatedAt: now
				}
			}).catch((e) => {
				if (e instanceof Prisma.PrismaClientKnownRequestError) {
					if (e.code === 'P2002') {
						throw new TRPCClientError(`Tank with name ${input.newName} already exists in your factory.`);
					}
				}

				throw e;
			});
		}),
	updateTankQuantity: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			name: z.string(),
			quantity: z.coerce.number().min(0)
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.tank.update({
				where: {
					name_factoryId: {
						factoryId: input.factoryId,
						name: input.name
					}
				},
				data: {
					quantity: input.quantity,
					updatedAt: now
				}
			});
		}),
	updateTankCapacity: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			name: z.string(),
			capacity: z.coerce.number().min(0)
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.tank.update({
				where: {
					name_factoryId: {
						factoryId: input.factoryId,
						name: input.name
					}
				},
				data: {
					capacity: input.capacity,
					updatedAt: now
				}
			});
		}),
	updateTankHeel: publicProcedure
		.input(z.object({
			factoryId: z.string(),
			name: z.string(),
			heel: z.coerce.number().min(0)
		}))
		.mutation(async ({ ctx, input }) => {
			const now = new Date();

			return ctx.prisma.tank.update({
				where: {
					name_factoryId: {
						factoryId: input.factoryId,
						name: input.name
					}
				},
				data: {
					heel: input.heel,
					updatedAt: now
				}
			});
		})
});

export type TankRouter = typeof tankRouter;
export type TankRouterInputs = inferRouterInputs<TankRouter>;
export type TankRouterOutputs = inferRouterOutputs<TankRouter>;