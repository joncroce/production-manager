import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { addBlendSchema, getBlendsByStatusSchema } from '@/schemas/blend';
import type { Blend } from '@prisma/client';

export const blendRouter = createTRPCRouter({
	getBlendsByStatus: publicProcedure
		.input(getBlendsByStatusSchema)
		.query(({ ctx, input }) => {
			return ctx.prisma.blend.findMany({
				where: {
					status: {
						in: input.status
					}
				}
			});
		}),
	add: publicProcedure
		.input(addBlendSchema)
		.mutation(async ({ ctx, input }) => {
			const { factoryId, formulaId, destinationTankName, targetQuantity, note } = input;

			return await ctx.prisma.$transaction(async (tx) => {
				const blend = await tx.blend.create({
					data: {
						Factory: {
							connect: {
								id: factoryId
							}
						},
						Formula: {
							connect: {
								id: formulaId
							}
						},
						DestinationTank: {
							connect: {
								name_factoryId: {
									name: destinationTankName, factoryId
								}
							}
						},
						targetQuantity,
						note
					}
				});

				for await (const {
					formulaComponentId, sourceTankName, targetQuantity, note
				} of input.components) {
					await tx.blendComponent.create({
						data: {
							Factory: {
								connect: {
									id: factoryId
								}
							},
							Blend: {
								connect: {
									id: blend.id
								}
							},
							FormulaComponent: {
								connect: {
									id: formulaComponentId
								}
							},
							SourceTank: {
								connect: {
									name_factoryId: {
										name: sourceTankName, factoryId
									}
								}
							},
							targetQuantity,
							note
						}
					});
				}

				return blend;
			});
		}),
	addMany: publicProcedure
		.input(z.array(addBlendSchema))
		.mutation(async ({ ctx, input }) => {
			const blends: Blend[] = [];

			for await (const {
				factoryId,
				formulaId,
				targetQuantity,
				destinationTankName,
				status,
				note,
				components
			} of input) {
				return await ctx.prisma.$transaction(async (tx) => {
					const blend = await tx.blend.create({
						data: {
							Factory: {
								connect: {
									id: factoryId
								}
							},
							Formula: {
								connect: {
									id: formulaId
								}
							},
							DestinationTank: {
								connect: {
									name_factoryId: {
										name: destinationTankName, factoryId
									}
								}
							},
							targetQuantity,
							note
						}
					});

					for await (const {
						formulaComponentId, sourceTankName, targetQuantity, note
					} of components) {
						await tx.blendComponent.create({
							data: {
								Factory: {
									connect: {
										id: factoryId
									}
								},
								Blend: {
									connect: {
										id: blend.id
									}
								},
								FormulaComponent: {
									connect: {
										id: formulaComponentId
									}
								},
								SourceTank: {
									connect: {
										name_factoryId: {
											name: sourceTankName, factoryId
										}
									}
								},
								targetQuantity,
								note
							}
						});
					}

					blends.push(blend);
				});
			}

			return blends;
		})
});

export type BlendRouter = typeof blendRouter;